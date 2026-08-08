import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCollectionDto) {
    return this.prisma.collection.create({ data });
  }

  async findAll() {
    return this.prisma.collection.findMany({ 
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ],
      include: { products: true } 
    });
  }

  async reorder(ids: string[]) {
    const transactions = ids.map((id, index) => {
      return this.prisma.collection.update({
        where: { id },
        data: { position: index },
      });
    });
    
    await this.prisma.$transaction(transactions);
    return { success: true };
  }

  async findOne(id: string) {
    return this.prisma.collection.findUnique({ where: { id }, include: { products: true } });
  }

  async update(id: string, data: UpdateCollectionDto) {
    return this.prisma.collection.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    // Prisma handles implicit many-to-many cleanup automatically
    return this.prisma.collection.delete({ where: { id } });
  }
}
