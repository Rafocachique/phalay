import { Injectable, Logger, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.supabase = createClient(
      this.config.getOrThrow('NEXT_PUBLIC_SUPABASE_URL'),
      this.config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async create(data: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
    status?: 'ACTIVE' | 'INACTIVE';
  }) {
    // Verificar si el correo ya existe en postgres
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Generar una contraseña temporal para el usuario
    const tempPassword = Math.random().toString(36).slice(-8) + 'aA1!';
    
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        firstName: data.firstName,
        lastName: data.lastName,
      }
    });

    if (authError || !authData.user) {
      this.logger.error(`Error de Supabase Auth al crear usuario: ${authError?.message}`);
      throw new BadRequestException(authError?.message || 'Error al crear usuario en el servidor de autenticación');
    }

    try {
      // Crear en PostgreSQL
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role as any,
          status: (data.status || 'ACTIVE') as any,
          supabaseAuthId: authData.user.id,
          emailVerified: true,
        },
      });

      this.logger.log(`Usuario creado exitosamente: ${user.email} con rol ${user.role}`);
      return {
        user,
        tempPassword,
      };
    } catch (err: any) {
      // Si falla en PostgreSQL, intentar revertir la creación en Supabase Auth
      await this.supabase.auth.admin.deleteUser(authData.user.id);
      this.logger.error(`Error en DB al guardar usuario, creación revertida: ${err.message}`);
      throw new BadRequestException('Error al registrar usuario en la base de datos');
    }
  }

  async update(id: string, data: {
    role?: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    firstName?: string;
    lastName?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role ? (data.role as any) : undefined,
        status: data.status ? (data.status as any) : undefined,
      },
    });

    this.logger.log(`Usuario actualizado: ${updated.email}`);
    return updated;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Eliminar de Supabase Auth
    try {
      const { error: authError } = await this.supabase.auth.admin.deleteUser(user.supabaseAuthId);
      if (authError) {
        this.logger.warn(`Error de Supabase Auth al eliminar usuario (puede no existir en auth): ${authError.message}`);
      }
    } catch (e: any) {
      this.logger.warn(`Error al intentar eliminar de Supabase: ${e.message}`);
    }

    // Eliminar de PostgreSQL
    await this.prisma.user.delete({
      where: { id },
    });

    this.logger.log(`Usuario eliminado: ${user.email}`);
    return { success: true, message: 'Usuario eliminado exitosamente' };
  }
}
