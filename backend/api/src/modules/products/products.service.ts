import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({ 
      take: 50, // Límite de seguridad contra ataques OOM
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ],
      include: { collections: true, images: true, variants: true, category: true } 
    });
  }

  async reorder(ids: string[]) {
    const transactions = ids.map((id, index) => {
      return this.prisma.product.update({
        where: { id },
        data: { position: index },
      });
    });
    
    await this.prisma.$transaction(transactions);
    return { success: true };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { collections: true, images: true, variants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug },
      include: {
        collections: true,
        images: true,
        variants: true,
        category: true,
        reviews: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 6,
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Productos relacionados reales: misma categoría, excluyendo el actual.
    const relatedProducts = await this.prisma.product.findMany({
      where: {
        id: { not: product.id },
        deletedAt: null,
        ...(product.categoryId ? { categoryId: product.categoryId } : {}),
      },
      include: { images: true },
      orderBy: { totalSold: 'desc' },
      take: 4,
    });

    return { ...product, relatedProducts };
  }

  async getCategories() {
    return this.prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any) {
    // Generate a basic slug if not provided
    const slug = data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    let category = await this.prisma.productCategory.findFirst();
    if (!category) {
      category = await this.prisma.productCategory.create({
        data: {
          name: 'General',
          slug: 'general'
        }
      });
    }

    const imageUrls = data.images || [];

    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description || '',
        price: data.price,
        sku: data.sku,
        slug,
        categoryId: data.categoryId || category.id,
        status: data.status || 'ACTIVE',
        tags: data.tags || [],
        images: imageUrls.length > 0 ? {
          create: imageUrls.map((url: string, index: number) => ({
            url,
            isMain: index === 0,
            position: index,
          }))
        } : undefined,
        collections: data.collectionIds && data.collectionIds.length > 0 ? {
          connect: data.collectionIds.map((id: string) => ({ id }))
        } : undefined,
      },
    });

    // Parse and generate variants
    const { sizes, colors } = parseTagsForVariants(data.tags || []);
    const variantCombinations = generateVariantCombinations(
      product.name,
      product.sku,
      Number(product.price),
      sizes,
      colors,
      data.stock !== undefined ? parseInt(data.stock) : 10
    );

    if (variantCombinations.length > 0) {
      await this.prisma.productVariant.createMany({
        data: variantCombinations.map(v => ({
          ...v,
          productId: product.id,
        })),
      });
    }

    return this.findOne(product.id);
  }

  async update(id: string, data: any) {
    const { images, collections, collectionIds, stock, variants, ...rest } = data;
    const updateData: any = { ...rest };

    if (images !== undefined) {
      updateData.images = {
        deleteMany: {},
        create: images.map((url: string, index: number) => ({
          url,
          isMain: index === 0,
          position: index,
        }))
      };
    }

    if (collectionIds !== undefined) {
      updateData.collections = {
        set: collectionIds.map((id: string) => ({ id }))
      };
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });

    if (data.tags !== undefined || data.price !== undefined || data.sku !== undefined || stock !== undefined || variants !== undefined) {
      const { sizes, colors } = parseTagsForVariants(updatedProduct.tags || []);
      const newStock = stock !== undefined ? parseInt(stock) : 10;
      
      const expectedCombinations = generateVariantCombinations(
        updatedProduct.name,
        updatedProduct.sku,
        Number(updatedProduct.price),
        sizes,
        colors,
        newStock
      );

      const currentVariants = await this.prisma.productVariant.findMany({
        where: { productId: id }
      });

      const keepVariantIds: string[] = [];

      for (const expected of expectedCombinations) {
        const existing = currentVariants.find(
          v => 
            (v.size || '') === (expected.size || '') && 
            (v.color || '') === (expected.color || '')
        );

        let variantStock = expected.stock;
        if (variants && Array.isArray(variants)) {
          const matchedVariantPayload = variants.find(
            (v: any) =>
              (v.size || '') === (expected.size || '') &&
              (v.color || '') === (expected.color || '')
          );
          if (matchedVariantPayload && matchedVariantPayload.stock !== undefined) {
            variantStock = parseInt(matchedVariantPayload.stock);
          }
        } else if (existing && stock === undefined) {
          // If we are not resetting stock and we didn't get variants payload, retain existing stock
          variantStock = existing.stock;
        }

        if (existing) {
          const updatedVar = await this.prisma.productVariant.update({
            where: { id: existing.id },
            data: {
              name: expected.name,
              sku: expected.sku,
              price: expected.price,
              colorHex: expected.colorHex,
              stock: variantStock,
            }
          });
          keepVariantIds.push(updatedVar.id);
        } else {
          const newVar = await this.prisma.productVariant.create({
            data: {
              ...expected,
              stock: variantStock,
              productId: id,
            }
          });
          keepVariantIds.push(newVar.id);
        }
      }

      const deleteIds = currentVariants
        .filter(v => !keepVariantIds.includes(v.id))
        .map(v => v.id);

      if (deleteIds.length > 0) {
        await this.prisma.productVariant.deleteMany({
          where: {
            id: { in: deleteIds }
          }
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  async assignCollection(productId: string, collectionId: string) {
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        collections: {
          connect: { id: collectionId },
        },
      },
      include: { collections: true },
    });
  }

  async removeCollection(productId: string, collectionId: string) {
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        collections: {
          disconnect: { id: collectionId },
        },
      },
      include: { collections: true },
    });
  }
}

function parseTagsForVariants(tags: string[]) {
  const sizes: string[] = [];
  const colors: { name: string; hex: string }[] = [];

  for (const tag of tags || []) {
    if (tag.startsWith('size:')) {
      sizes.push(tag.replace('size:', ''));
    } else if (tag.startsWith('color:')) {
      const parts = tag.replace('color:', '').split(':');
      if (parts[0]) {
        colors.push({ name: parts[0], hex: parts[1] || '#000000' });
      }
    }
  }

  return { sizes, colors };
}

function generateVariantCombinations(
  productName: string,
  productSku: string,
  productPrice: number,
  sizes: string[],
  colors: { name: string; hex: string }[],
  initialStock: number
) {
  const variants = [];
  const stock = initialStock !== undefined ? initialStock : 10;

  const sanitizeForSku = (str: string) => {
    return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  if (sizes.length > 0 && colors.length > 0) {
    for (const size of sizes) {
      for (const color of colors) {
        variants.push({
          name: `${productName} - ${size} / ${color.name}`,
          sku: `${productSku}-${sanitizeForSku(size)}-${sanitizeForSku(color.name)}`,
          price: productPrice,
          stock,
          size,
          color: color.name,
          colorHex: color.hex,
        });
      }
    }
  } else if (sizes.length > 0) {
    for (const size of sizes) {
      variants.push({
        name: `${productName} - ${size}`,
        sku: `${productSku}-${sanitizeForSku(size)}`,
        price: productPrice,
        stock,
        size,
        color: null,
        colorHex: null,
      });
    }
  } else if (colors.length > 0) {
    for (const color of colors) {
      variants.push({
        name: `${productName} - ${color.name}`,
        sku: `${productSku}-${sanitizeForSku(color.name)}`,
        price: productPrice,
        stock,
        size: null,
        color: color.name,
        colorHex: color.hex,
      });
    }
  } else {
    variants.push({
      name: `${productName} - Estándar`,
      sku: `${productSku}-STD`,
      price: productPrice,
      stock,
      size: null,
      color: null,
      colorHex: null,
    });
  }

  return variants;
}
