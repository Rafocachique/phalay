import { prisma } from '@phalay/database';

export const categoriesService = {
  async findAll() {
    return prisma.productCategory.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  },

  async findOne(id: string) {
    const category = await prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category) throw new Error('Categoría no encontrada');
    return category;
  },

  async create(data: { name: string; description?: string; imageUrl?: string; isActive?: boolean }) {
    const slug = data.name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9ñ]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return prisma.productCategory.create({
      data: {
        ...data,
        slug,
      },
    });
  },

  async reorder(ids: string[]) {
    const transactions = ids.map((id, index) => {
      return prisma.productCategory.update({
        where: { id },
        data: { position: index },
      });
    });
    await prisma.$transaction(transactions);
    return { success: true };
  },

  async update(id: string, data: any) {
    const dataToUpdate: any = { ...data };
    if (data.name) {
      dataToUpdate.slug = data.name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9ñ]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    return prisma.productCategory.update({
      where: { id },
      data: dataToUpdate,
    });
  },

  async remove(id: string) {
    return prisma.productCategory.delete({
      where: { id },
    });
  },
};
