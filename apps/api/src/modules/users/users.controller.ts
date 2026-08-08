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

  @Get()
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
    };
  }

  @Get(':id')
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      success: true,
      data: user,
    };
  }

  @Post()
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiOperation({ summary: 'Crear un nuevo usuario administrador/vendedor' })
  async create(
    @Body() body: {
      email: string;
      firstName: string;
      lastName: string;
      role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
      status?: 'ACTIVE' | 'INACTIVE';
    },
    @GetUser() requester: any,
  ) {
    // Sólo un SUPER_ADMIN puede otorgar los roles ADMIN o SUPER_ADMIN.
    if ((body.role === 'ADMIN' || body.role === 'SUPER_ADMIN') && requester.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Sólo un SUPER_ADMIN puede crear cuentas de administrador');
    }
    const result = await this.usersService.create(body);
    return {
      success: true,
      data: result.user,
      tempPassword: result.tempPassword,
      message: 'Usuario creado exitosamente',
    };
  }

  @Patch(':id')
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiOperation({ summary: 'Actualizar rol o estado de un usuario' })
  async update(
    @Param('id') id: string,
    @Body() body: {
      role?: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
      firstName?: string;
      lastName?: string;
    },
    @GetUser() requester: any,
  ) {
    // Sólo un SUPER_ADMIN puede ascender a alguien a ADMIN o SUPER_ADMIN.
    if ((body.role === 'ADMIN' || body.role === 'SUPER_ADMIN') && requester.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Sólo un SUPER_ADMIN puede otorgar permisos de administrador');
    }
    const user = await this.usersService.update(id, body);
    return {
      success: true,
      data: user,
      message: 'Usuario actualizado exitosamente',
    };
  }

  @Delete(':id')
  @Roles(['SUPER_ADMIN'])
  @ApiOperation({ summary: 'Eliminar un usuario permanentemente' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
