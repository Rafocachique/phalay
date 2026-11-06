import { prisma } from '@phalay/database';

function parseTagsForVariants(tags: string[]) {
  const sizes: string[] = [];
  const colors: { name: string; hex: string }[] = [];

  for (const tag of tags) {
    if (tag.startsWith('Talla:')) {
      const sizeVal = tag.replace('Talla:', '').trim();
      if (sizeVal && !sizes.includes(sizeVal)) {
        sizes.push(sizeVal);
      }
    } else if (tag.startsWith('Color:')) {
      const colorVal = tag.replace('Color:', '').trim();
      const parts = colorVal.split('|');
      const name = parts[0]?.trim();
      const hex = parts[1]?.trim() || '#000000';
      if (name && !colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        colors.push({ name, hex });
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
  initialStock: number,
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

export const productsService = {
  async findAll(params?: { limit?: number; categoryId?: string; collectionId?: string }) {
    const where: any = { deletedAt: null };
    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }
    if (params?.collectionId) {
      where.collections = { some: { id: params.collectionId } };
    }

    return prisma.product.findMany({
      where,
      take: params?.limit ? Number(params.limit) : 50,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: { collections: true, images: true, variants: true, category: true },
    });
  },

  async reorder(ids: string[]) {
    const transactions = ids.map((id, index) => {
      return prisma.product.update({
        where: { id },
        data: { position: index },
      });
    });
    await prisma.$transaction(transactions);
    return { success: true };
  },

  async findOne(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { collections: true, images: true, variants: true, category: true },
    });
    if (!product) throw new Error('Producto no encontrado');
    return product;
  },

  async findBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: { slug, deletedAt: null },
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
    if (!product) throw new Error('Producto no encontrado');

    const relatedProducts = await prisma.product.findMany({
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
  },

  async create(data: any) {
    const slug = data.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    let category = await prisma.productCategory.findFirst();
    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          name: 'General',
          slug: 'general',
        },
      });
    }

    const imageUrls = data.images || [];

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || '',
        price: data.price,
        sku: data.sku,
        slug,
        categoryId: data.categoryId || category.id,
        status: data.status || 'ACTIVE',
        tags: data.tags || [],
        images:
          imageUrls.length > 0
            ? {
                create: imageUrls.map((url: string, index: number) => ({
                  url,
                  isMain: index === 0,
                  position: index,
                })),
              }
            : undefined,
        collections:
          data.collectionIds && data.collectionIds.length > 0
            ? {
                connect: data.collectionIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
    });

    const { sizes, colors } = parseTagsForVariants(data.tags || []);
    const variantCombinations = generateVariantCombinations(
      product.name,
      product.sku,
      Number(product.price),
      sizes,
      colors,
      data.stock !== undefined ? parseInt(data.stock) : 10,
    );

    if (variantCombinations.length > 0) {
      await prisma.productVariant.createMany({
        data: variantCombinations.map((v) => ({
          ...v,
          productId: product.id,
        })),
      });
    }

    return this.findOne(product.id);
  },

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
        })),
      };
    }

    if (collectionIds !== undefined) {
      updateData.collections = {
        set: collectionIds.map((id: string) => ({ id })),
      };
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    if (variants !== undefined && Array.isArray(variants)) {
      for (const variant of variants) {
        if (variant.id) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              price: variant.price !== undefined ? Number(variant.price) : undefined,
              stock: variant.stock !== undefined ? Number(variant.stock) : undefined,
              sku: variant.sku || undefined,
            },
          });
        }
      }
    }

    return this.findOne(updated.id);
  },

  async remove(id: string) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  },

  async deleteReview(reviewId: string) {
    return prisma.review.update({
      where: { id: reviewId },
      data: { deletedAt: new Date() },
    });
  },
};
