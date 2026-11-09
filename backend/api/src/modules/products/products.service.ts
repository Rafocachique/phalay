import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({ 
      take: 50, // Límite de seguridad contra ataques OOM
      where: { deletedAt: null },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ],
      include: { collections: true, images: true, variants: { where: { isActive: true } }, category: true }
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
      include: { collections: true, images: true, variants: { where: { isActive: true } } },
    });
    if (!product || product.deletedAt) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        collections: true,
        images: true,
        variants: { where: { isActive: true } },
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
    const slug = await this.nextAvailableSlug(data.name);
    
    let category = await this.prisma.productCategory.findFirst();
    if (!category) {
      category = await this.prisma.productCategory.create({
        data: {
          name: 'General',
          slug: 'general'
        }
      });
    }

    const imageUrls = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
    const variants = this.buildVariants(data, data.name, data.sku, Number(data.price));

    try {
      const product = await this.prisma.$transaction(async (tx) => {
        if (data.featured) {
          await this.ensureFeaturedCapacity(tx);
        }
        const created = await tx.product.create({
          data: {
            name: data.name.trim(),
            description: data.description || '',
            price: data.price,
            sku: data.sku.trim(),
            slug,
            categoryId: data.categoryId || category.id,
            status: data.status || 'ACTIVE',
            featured: Boolean(data.featured),
            tags: data.tags || [],
            images: imageUrls.length > 0 ? {
              create: imageUrls.map((url: string, index: number) => ({
                url,
                isMain: index === 0,
                position: index,
              })),
            } : undefined,
            collections: data.collectionIds?.length > 0 ? {
              connect: data.collectionIds.map((id: string) => ({ id })),
            } : undefined,
          },
        });

        await tx.productVariant.createMany({
          data: variants.map((variant: any) => ({ ...variant, productId: created.id })),
        });
        return created;
      });
      return this.findOne(product.id);
    } catch (error) {
      this.throwProductWriteError(error);
    }
  }

  private async nextAvailableSlug(name: string) {
    const base = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'producto';

    let candidate = base;
    let suffix = 2;
    while (await this.prisma.product.findFirst({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix++}`;
    }
    return candidate;
  }

  private buildVariants(data: any, productName: string, productSku: string, price: number) {
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      const keys = new Set<string>();
      return data.variants.map((input: any, index: number) => {
        const size = typeof input.size === 'string' && input.size.trim() ? input.size.trim() : null;
        const color = typeof input.color === 'string' && input.color.trim() ? input.color.trim() : null;
        const stock = Number(input.stock);
        if (!Number.isInteger(stock) || stock < 0) {
          throw new BadRequestException(`El stock de la variante ${index + 1} debe ser un entero igual o mayor a cero.`);
        }
        const key = `${size || ''}:${color || ''}`;
        if (keys.has(key)) {
          throw new BadRequestException('No repitas la misma combinación de talla y color.');
        }
        keys.add(key);
        return buildVariant(productName, productSku, price, size, color, input.colorHex, stock);
      });
    }

    const { sizes, colors } = parseTagsForVariants(data.tags || []);
    return generateVariantCombinations(
      productName,
      productSku,
      price,
      sizes,
      colors,
      data.stock !== undefined ? Number(data.stock) : 10,
    );
  }

  private throwProductWriteError(error: unknown): never {
    if (error instanceof BadRequestException) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const fields = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'SKU';
        throw new BadRequestException(`Ya existe un producto con ese ${fields}. Usa un SKU diferente.`);
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('La categoría o colección seleccionada ya no existe. Recarga la página y vuelve a elegirla.');
      }
    }
    throw error;
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

    try {
      await this.prisma.$transaction(async (tx) => {
        const currentProduct = await tx.product.findUnique({ where: { id }, select: { featured: true } });
        if (data.featured === true && !currentProduct?.featured) {
          await this.ensureFeaturedCapacity(tx, id);
        }
        const updatedProduct = await tx.product.update({ where: { id }, data: updateData });
        if (data.tags === undefined && data.price === undefined && data.sku === undefined && stock === undefined && variants === undefined) return;

        const expectedCombinations = this.buildVariants(
          { ...data, variants, stock },
          updatedProduct.name,
          updatedProduct.sku,
          Number(updatedProduct.price),
        );
        const currentVariants = await tx.productVariant.findMany({ where: { productId: id } });
        const keepVariantIds: string[] = [];

        for (const expected of expectedCombinations) {
          const existing = currentVariants.find((variant) =>
            (variant.size || '') === (expected.size || '') && (variant.color || '') === (expected.color || ''),
          );
          if (existing) {
            await tx.productVariant.update({
              where: { id: existing.id },
              data: { ...expected, isActive: true },
            });
            keepVariantIds.push(existing.id);
          } else {
            const created = await tx.productVariant.create({ data: { ...expected, productId: id } });
            keepVariantIds.push(created.id);
          }
        }

        // No se borran variantes con historial de pedidos: se inactivan para
        // que no vuelvan a venderse y el comprobante histórico siga íntegro.
        const inactiveIds = currentVariants.filter((variant) => !keepVariantIds.includes(variant.id)).map((variant) => variant.id);
        if (inactiveIds.length > 0) {
          await tx.productVariant.updateMany({ where: { id: { in: inactiveIds } }, data: { isActive: false } });
        }
      });
      return this.findOne(id);
    } catch (error) {
      this.throwProductWriteError(error);
    }
  }

  private async ensureFeaturedCapacity(tx: Prisma.TransactionClient, productId?: string) {
    const featuredCount = await tx.product.count({
      where: {
        featured: true,
        deletedAt: null,
        status: 'ACTIVE',
        ...(productId ? { id: { not: productId } } : {}),
      },
    });
    if (featuredCount >= 8) {
      throw new BadRequestException('Puedes destacar como máximo 8 productos en la Nueva colección. Quita uno antes de agregar otro.');
    }
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.deletedAt) throw new NotFoundException('Producto no encontrado');

    // Un producto puede estar vinculado a pedidos históricos. Archivarlo evita
    // una violación de llave foránea, preserva el comprobante de la clienta y
    // lo excluye de catálogo y checkout.
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
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
  const stock = Number.isInteger(initialStock) && initialStock >= 0 ? initialStock : 10;

  if (sizes.length > 0 && colors.length > 0) {
    for (const size of sizes) {
      for (const color of colors) {
        variants.push(buildVariant(productName, productSku, productPrice, size, color.name, color.hex, stock));
      }
    }
  } else if (sizes.length > 0) {
    for (const size of sizes) {
      variants.push(buildVariant(productName, productSku, productPrice, size, null, null, stock));
    }
  } else if (colors.length > 0) {
    for (const color of colors) {
      variants.push(buildVariant(productName, productSku, productPrice, null, color.name, color.hex, stock));
    }
  } else {
    variants.push(buildVariant(productName, productSku, productPrice, null, null, null, stock));
  }

  return variants;
}

function buildVariant(
  productName: string,
  productSku: string,
  productPrice: number,
  size: string | null,
  color: string | null,
  colorHex: string | null | undefined,
  stock: number,
) {
  const sanitizeForSku = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'STD';
  const suffix = [size && sanitizeForSku(size), color && sanitizeForSku(color)].filter(Boolean).join('-') || 'STD';
  return {
    name: `${productName} - ${[size, color].filter(Boolean).join(' / ') || 'Estándar'}`,
    sku: `${productSku}-${suffix}`,
    price: productPrice,
    stock,
    size,
    color,
    colorHex: color ? colorHex || '#000000' : null,
  };
}
