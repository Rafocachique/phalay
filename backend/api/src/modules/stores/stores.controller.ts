import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  async getStore() {
    return this.storesService.getStore();
  }

  /** Configuración completa para el panel: incluye datos que no son públicos. */
  @Get('admin')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async getStoreAdmin() {
    return this.storesService.getStoreAdmin();
  }

  @Patch()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async updateStore(@Body() data: any) {
    return this.storesService.updateStore(data);
  }

  @Get('faqs')
  async getFaqs() {
    return this.storesService.getFaqs();
  }

  @Post('faqs')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async createFaq(@Body() data: { question: string, answer: string }) {
    return this.storesService.createFaq(data);
  }

  @Patch('faqs/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async updateFaq(@Param('id') id: string, @Body() data: any) {
    return this.storesService.updateFaq(id, data);
  }

  @Delete('faqs/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async deleteFaq(@Param('id') id: string) {
    return this.storesService.deleteFaq(id);
  }
}
