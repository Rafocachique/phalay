import { prisma } from '@phalay/database';

export const collectionsService = {
  async findAll() {
    return prisma.collection.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: {
        products: {
          include: { images: true, variants: true },
        },
      },
    });
  },

  async findOne(id: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        products: {
          include: { images: true, variants: true },
        },
      },
    });
    if (!collection) throw new Error('Colección no encontrada');
    return collection;
  },

  async create(data: { name: string; description?: string; imageUrl?: string; position?: number }) {
    return prisma.collection.create({
      data: {
        name: data.name,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        position: data.position ?? 0,
      },
    });
  },

  async reorder(ids: string[]) {
    const transactions = ids.map((id, index) => {
      return prisma.collection.update({
        where: { id },
        data: { position: index },
      });
    });
    await prisma.$transaction(transactions);
    return { success: true };
  },

  async update(id: string, data: any) {
    return prisma.collection.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        description: data.description !== undefined ? data.description : undefined,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
        position: data.position !== undefined ? data.position : undefined,
      },
    });
  },

  async remove(id: string) {
    return prisma.collection.delete({
      where: { id },
    });
  },
};
