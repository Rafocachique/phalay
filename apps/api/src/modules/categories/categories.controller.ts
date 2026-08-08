import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Post('reorder')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  reorder(@Body('ids') ids: string[]) {
    return this.categoriesService.reorder(ids);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
