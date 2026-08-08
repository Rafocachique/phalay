import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, NotFoundException, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OrderStatus } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Crear una nueva orden
   * Puede ser anónima (checkout guest) o autenticada
   */
  @Post()
  @ApiOperation({ summary: 'Crear nueva orden' })
  async create(@Body() createDto: any) {
    return this.ordersService.create(createDto);
  }

  /**
   * Obtener todas las órdenes (solo para admins/vendedores)
   */
  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['SELLER', 'ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las órdenes' })
  async findAll() {
    return this.ordersService.findAll();
  }

  /**
   * Pedidos de la clienta autenticada. Sólo requiere sesión (cualquier rol):
   * el listado se arma con su propio id, nunca con datos del cliente.
   */
  @Get('mine')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis pedidos' })
  async findMine(@GetUser() user: any) {
    return this.ordersService.findAllUserOrders(user.id);
  }

  /**
   * Seguimiento de pedido para invitados (checkout sin cuenta).
   * Requiere el correo Y el número de pedido exactos — así no se puede
   * listar el historial completo de compras de alguien sólo con su email.
   */
  @Get('track')
  @ApiOperation({ summary: 'Buscar un pedido puntual por email + número de pedido' })
  async track(@Query('email') email: string, @Query('orderNumber') orderNumber: string) {
    if (!email || !orderNumber) {
      throw new NotFoundException('Pedido no encontrado');
    }
    const order = await this.ordersService.findByEmailAndOrderNumber(email, orderNumber);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return order;
  }

  /**
   * Obtener una orden específica (sólo el dueño de la orden o un vendedor/admin)
   */
  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener orden por ID' })
  async findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.ordersService.findOne(id, user);
  }

  /**
   * Actualizar el estado de una orden (solo vendedores/admins)
   */
  /**
   * Confirma o rechaza el pago tras revisar la captura que envió la clienta.
   * Sólo aplica a pagos manuales (Yape con QR): los de Culqi se confirman solos.
   */
  @Patch(':id/payment')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['SELLER', 'ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar o rechazar el pago de un pedido' })
  async reviewPayment(
    @Param('id') id: string,
    @Body('approved') approved: boolean,
    @GetUser() user: any,
  ) {
    return this.ordersService.reviewManualPayment(id, approved, user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['SELLER', 'ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado de la orden' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @GetUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una orden' })
  async delete(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
