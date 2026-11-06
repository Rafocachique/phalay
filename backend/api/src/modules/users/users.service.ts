import { Injectable, Logger, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  /** Conteos para el dashboard, sin exponer ningún dato personal. */
  async getStats() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalUsers, totalCustomers, newThisMonth, newPrevMonth] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfPrevMonth, lt: startOfThisMonth } } }),
    ]);

    return { totalUsers, totalCustomers, newThisMonth, newPrevMonth };
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
    password?: string;
  }) {
    const email = (data.email || '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      throw new BadRequestException('El correo electrónico no tiene un formato válido.');
    }

    // Búsqueda sin distinguir mayúsculas: el índice único de Postgres sí las
    // distingue, así que un findUnique exacto dejaría crear duplicados.
    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Generar una contraseña temporal si no se especificó una personalizada
    const tempPassword = data.password || (Math.random().toString(36).slice(-8) + 'aA1!');
    
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email,
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
          email,
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

  async update(
    id: string,
    data: {
      email?: string;
      role?: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
      firstName?: string;
      lastName?: string;
      password?: string;
    },
    requesterId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Se normaliza antes de comparar y de guardar: sin esto, " Ana@X.com "
    // y "ana@x.com" se tratan como correos distintos.
    const newEmail = data.email ? data.email.trim().toLowerCase() : undefined;
    const emailChanged = !!newEmail && newEmail !== user.email.toLowerCase();

    if (newEmail && !EMAIL_REGEX.test(newEmail)) {
      throw new BadRequestException('El correo electrónico no tiene un formato válido.');
    }

    if (emailChanged) {
      // Comparación sin distinguir mayúsculas: el índice único de Postgres sí
      // las distingue, así que un findUnique exacto dejaba pasar duplicados
      // como "ANA@x.com" frente a "ana@x.com".
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: { equals: newEmail, mode: 'insensitive' }, NOT: { id } },
      });
      if (existingEmail) {
        throw new ConflictException('El correo electrónico ya está registrado por otro usuario');
      }

      const { error: authError } = await this.supabase.auth.admin.updateUserById(user.supabaseAuthId, {
        email: newEmail,
        email_confirm: true,
      });

      if (authError) {
        // El detalle interno queda en el log; al cliente se le da un mensaje
        // claro sin exponer entrañas del proveedor de autenticación.
        this.logger.error(`Error de Supabase al cambiar email de ${user.email} a ${newEmail}: ${authError.message}`);
        throw new BadRequestException('No pudimos cambiar el correo. Revisa que sea válido y que no esté en uso.');
      }
    }

    if (data.password) {
      const { error: authError } = await this.supabase.auth.admin.updateUserById(user.supabaseAuthId, {
        password: data.password,
      });
      if (authError) {
        this.logger.error(`Error de Supabase al cambiar contraseña de ${user.email}: ${authError.message}`);
        throw new BadRequestException('No pudimos cambiar la contraseña. Revisa que cumpla los requisitos mínimos.');
      }
    }

    let updated: Awaited<ReturnType<typeof this.prisma.user.update>>;
    try {
      updated = await this.prisma.user.update({
        where: { id },
        data: {
          email: newEmail,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role ? (data.role as any) : undefined,
          status: data.status ? (data.status as any) : undefined,
          // Un correo nuevo no está probado: hasta que su dueño confirme el
          // código, la cuenta no debe contar como verificada.
          ...(emailChanged ? { emailVerified: false, verificationCode: null, verificationCodeExpiresAt: null, verificationAttempts: 0 } : {}),
        },
      });
    } catch (err: any) {
      // Si el correo ya se cambió en Supabase pero la BD falla, se revierte
      // para que ambos sistemas no queden desincronizados.
      if (emailChanged) {
        await this.supabase.auth.admin
          .updateUserById(user.supabaseAuthId, { email: user.email, email_confirm: true })
          .catch(() => undefined);
      }
      this.logger.error(`Error al actualizar usuario ${user.email}: ${err.message}`);
      throw new BadRequestException('No pudimos guardar los cambios del usuario.');
    }

    // Cambiar correo, rol, estado o contraseña de otra persona son acciones
    // sensibles: quedan registradas para poder auditarlas después.
    const changes: string[] = [];
    if (emailChanged) changes.push('email');
    if (data.password) changes.push('password');
    if (data.role) changes.push('role');
    if (data.status) changes.push('status');

    if (changes.length > 0) {
      await this.prisma.auditLog
        .create({
          data: {
            userId: requesterId,
            action: 'USER_UPDATED',
            entity: 'User',
            entityId: id,
            oldValues: { email: user.email, role: user.role, status: user.status },
            // Nunca se guarda la contraseña, sólo que hubo un cambio.
            newValues: { campos: changes, email: updated.email, role: updated.role, status: updated.status },
          },
        })
        .catch(() => undefined);
    }

    this.logger.log(`Usuario actualizado: ${updated.email} (${changes.join(', ') || 'datos personales'})`);
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
