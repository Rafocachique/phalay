import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Todo el módulo de Equipo/Usuarios es exclusivo del SUPER_ADMIN: un ADMIN
  // gestiona la tienda (productos, pedidos, envíos, pagos) pero no puede ver
  // ni tocar las cuentas del equipo.
  @Get()
  @Roles(['SUPER_ADMIN'])
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
    };
  }

  /**
   * Sólo cifras agregadas para el dashboard: un ADMIN necesita saber cuántas
   * clientas hay registradas, pero no puede ver el listado ni sus datos.
   * Va declarado antes de :id para que Nest no lo confunda con un id.
   */
  @Get('stats')
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiOperation({ summary: 'Conteos agregados de usuarios (sin datos personales)' })
  async stats() {
    const data = await this.usersService.getStats();
    return { success: true, data };
  }

  @Get(':id')
  @Roles(['SUPER_ADMIN'])
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      success: true,
      data: user,
    };
  }

  @Post()
  @Roles(['SUPER_ADMIN'])
  @ApiOperation({ summary: 'Crear un nuevo usuario administrador/vendedor' })
  async create(
    @Body() body: {
      email: string;
      firstName: string;
      lastName: string;
      role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
      status?: 'ACTIVE' | 'INACTIVE';
      password?: string;
    },
  ) {
    const result = await this.usersService.create(body);
    return {
      success: true,
      data: result.user,
      tempPassword: result.tempPassword,
      message: 'Usuario creado exitosamente',
    };
  }

  @Patch(':id')
  @Roles(['SUPER_ADMIN'])
  @ApiOperation({ summary: 'Actualizar rol o estado de un usuario' })
  async update(
    @Param('id') id: string,
    @Body() body: {
      email?: string;
      role?: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
      firstName?: string;
      lastName?: string;
      password?: string;
    },
    @GetUser() requester: any,
  ) {
    // Un SUPER_ADMIN no puede quitarse a sí mismo el rol ni desactivarse:
    // así nadie se deja fuera del panel por accidente.
    if (requester.id === id && (body.role || body.status)) {
      throw new ForbiddenException('No puedes cambiar tu propio rol ni desactivar tu cuenta.');
    }
    const user = await this.usersService.update(id, body, requester.id);
    return {
      success: true,
      data: user,
      message: 'Usuario actualizado exitosamente',
    };
  }

  @Delete(':id')
  @Roles(['SUPER_ADMIN'])
  @ApiOperation({ summary: 'Eliminar un usuario permanentemente' })
  async remove(@Param('id') id: string, @GetUser() requester: any) {
    if (requester.id === id) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta.');
    }
    return this.usersService.remove(id);
  }
}
