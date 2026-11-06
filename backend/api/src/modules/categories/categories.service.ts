import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const slug = createCategoryDto.name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9ñ]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return this.prisma.productCategory.create({
      data: {
        ...createCategoryDto,
        slug,
      },
    });
  }

  async findAll() {
    return this.prisma.productCategory.findMany({
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async reorder(ids: string[]) {
    const transactions = ids.map((id, index) => {
      return this.prisma.productCategory.update({
        where: { id },
        data: { position: index },
      });
    });
    
    await this.prisma.$transaction(transactions);
    return { success: true };
  }

  async findOne(id: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Generate new slug if name is updated
    let dataToUpdate: any = { ...updateCategoryDto };
    if (updateCategoryDto.name) {
      dataToUpdate.slug = updateCategoryDto.name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9ñ]+/g, '-') // Allow ñ, replace other non-alphanumeric with -
        .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
    }

    return this.prisma.productCategory.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.productCategory.delete({
        where: { id },
      });
    } catch (error) {
      // Prisma foreign key violation when category has related products
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('No se puede eliminar porque tiene productos asociados');
      }
      throw error;
    }
  }
}
