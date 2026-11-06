import { Controller, Get, Post, Body, Param, Patch, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  async findAll() {
    return this.collectionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const collection = await this.collectionsService.findOne(id);
    if (!collection) {
      throw new NotFoundException(`Collection with id ${id} not found`);
    }
    return collection;
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async create(@Body() createDto: CreateCollectionDto) {
    return this.collectionsService.create(createDto);
  }

  @Post('reorder')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async reorder(@Body('ids') ids: string[]) {
    return this.collectionsService.reorder(ids);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateDto: UpdateCollectionDto) {
    return this.collectionsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }
}
