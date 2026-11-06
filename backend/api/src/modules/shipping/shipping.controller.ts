import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  // ── Agencias de transporte (catálogo estandarizado) ──

  /** GET /api/v1/shipping/agencies?active=true */
  @Get('agencies')
  async findAllAgencies(@Query('active') active?: string) {
    return this.shippingService.findAllAgencies(active === 'true');
  }

  /** POST /api/v1/shipping/agencies */
  @Post('agencies')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async createAgency(@Body() body: any) {
    return this.shippingService.createAgency(body);
  }

  /** PATCH /api/v1/shipping/agencies/:id */
  @Patch('agencies/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async updateAgency(@Param('id') id: string, @Body() body: any) {
    return this.shippingService.updateAgency(id, body);
  }

  /** DELETE /api/v1/shipping/agencies/:id */
  @Delete('agencies/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async removeAgency(@Param('id') id: string) {
    return this.shippingService.removeAgency(id);
  }

  // ── Destinations ──

  /** GET /api/v1/shipping/destinations?active=true */
  @Get('destinations')
  async findAll(@Query('active') active?: string) {
    return this.shippingService.findAll(active === 'true');
  }

  /** GET /api/v1/shipping/destinations/:id */
  @Get('destinations/:id')
  async findOne(@Param('id') id: string) {
    return this.shippingService.findOne(id);
  }

  /** POST /api/v1/shipping/destinations */
  @Post('destinations')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async create(@Body() body: any) {
    return this.shippingService.create(body);
  }

  /** PATCH /api/v1/shipping/destinations/:id */
  @Patch('destinations/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() body: any) {
    return this.shippingService.update(id, body);
  }

  /** DELETE /api/v1/shipping/destinations/:id */
  @Delete('destinations/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return this.shippingService.remove(id);
  }

  // ── Missing Requests ──

  /** GET /api/v1/shipping/requests */
  @Get('requests')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async findAllRequests() {
    return this.shippingService.findAllRequests();
  }

  /** PATCH /api/v1/shipping/requests/:id/resolve */
  @Patch('requests/:id/resolve')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async resolveRequest(@Param('id') id: string, @Body() body: { destinationId?: string }) {
    return this.shippingService.resolveRequest(id, body.destinationId);
  }

  /**
   * POST /api/v1/shipping/requests/:id/destination
   * Crea el destino solicitado y resuelve la solicitud en una sola operación.
   */
  @Post('requests/:id/destination')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  async resolveWithNewDestination(@Param('id') id: string, @Body() body: any) {
    return this.shippingService.resolveRequestWithNewDestination(id, body);
  }

  /** POST /api/v1/shipping/requests (creado por el cliente en el checkout, público a propósito) */
  @Post('requests')
  async createRequest(@Body() body: any) {
    return this.shippingService.createRequest(body);
  }
}
