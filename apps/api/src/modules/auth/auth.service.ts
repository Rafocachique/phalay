import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomInt, createHash, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { sendVerificationCodeEmail } from './verification-email';

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
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

  async onModuleInit() {
    const adminEmail = this.config.get<string>('SEED_ADMIN_EMAIL');
    const adminPassword = this.config.get<string>('SEED_ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      this.logger.warn('SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD no configurados — omitiendo creación de administrador semilla.');
      return;
    }

    this.logger.log('Sincronizando usuario administrador semilla...');
    try {

      // 1. Buscar el usuario en Supabase Auth por email
      const { data: { users }, error: listError } = await this.supabase.auth.admin.listUsers();
      
      if (listError) {
        this.logger.error(`Error al listar usuarios de Supabase: ${listError.message}`);
        return;
      }

      let supabaseUser: any = users?.find(u => u.email === adminEmail);

      if (!supabaseUser) {
        this.logger.log(`Usuario administrador semilla no encontrado en Supabase Auth. Creando...`);
        const { data: { user: newUser }, error: createError } = await this.supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
        });

        if (createError || !newUser) {
          this.logger.error(`Error al crear usuario administrador en Supabase: ${createError?.message || 'Usuario nulo'}`);
          return;
        }

        supabaseUser = newUser;
        this.logger.log(`Usuario administrador semilla creado en Supabase Auth con ID: ${supabaseUser.id}`);
      } else {
        this.logger.log(`Usuario administrador semilla ya existe en Supabase Auth con ID: ${supabaseUser.id}`);
      }

      // 2. Buscar o sincronizar en la base de datos PostgreSQL
      const dbUser = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (!dbUser) {
        this.logger.log(`Usuario administrador semilla no encontrado en PostgreSQL. Creando...`);
        await this.prisma.user.create({
          data: {
            email: adminEmail,
            firstName: 'Elena',
            lastName: 'Rivas',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
            supabaseAuthId: supabaseUser.id,
          },
        });
        this.logger.log(`Usuario administrador semilla creado en PostgreSQL.`);
      } else if (dbUser.supabaseAuthId !== supabaseUser.id) {
        this.logger.log(`Actualizando supabaseAuthId en PostgreSQL de ${dbUser.supabaseAuthId} a ${supabaseUser.id} para coincidir con Supabase...`);
        await this.prisma.user.update({
          where: { email: adminEmail },
          data: { supabaseAuthId: supabaseUser.id },
        });
        this.logger.log(`PostgreSQL sincronizado exitosamente con Supabase.`);
      } else {
        this.logger.log(`PostgreSQL ya está sincronizado con Supabase para el administrador.`);
      }
    } catch (err: any) {
      this.logger.error(`Error durante la inicialización de AuthService: ${err.message}`, err.stack);
    }
  }

  /**
   * Verifica un JWT de Supabase y retorna el usuario
   */
  async verifyToken(token: string) {
    try {
      const anonClient = createClient(
        this.config.getOrThrow('NEXT_PUBLIC_SUPABASE_URL'),
        this.config.getOrThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      );
      const { data, error } = await anonClient.auth.getUser(token);

      if (error || !data.user) {
        this.logger.warn(`Token inválido: ${error?.message}`);
        return null;
      }

      // Buscar usuario en nuestra BD
      const user = await this.prisma.user.findUnique({
        where: { supabaseAuthId: data.user.id },
      });

      return user;
    } catch (e: any) {
      this.logger.error(`Error verificando token: ${e.message}`);
      return null;
    }
  }

  /**
   * Registra un nuevo usuario en la BD después de la creación en Supabase
   * Si el usuario ya existe (por supabaseAuthId o email), lo retorna/actualiza sin error
   */
  async registerUser(data: {
    supabaseAuthId: string;
    email: string;
    firstName: string;
    lastName: string;
    /** true sólo cuando el proveedor (p. ej. Google) ya confirmó el correo por nosotros. */
    emailVerified?: boolean;
  }) {
    try {
      // 1. Verificar si el usuario ya existe por supabaseAuthId
      const existingById = await this.prisma.user.findUnique({
        where: { supabaseAuthId: data.supabaseAuthId },
      });

      if (existingById) {
        this.logger.log(`Usuario ya existe por supabaseAuthId: ${data.email}`);
        return existingById;
      }

      // 2. Verificar si el usuario ya existe por email (puede tener otro supabaseAuthId)
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingByEmail) {
        // Actualizar el supabaseAuthId para sincronizar. El rol NUNCA se toca aquí:
        // el registro público no puede otorgar ni cambiar roles.
        this.logger.log(`Usuario existe por email, actualizando supabaseAuthId: ${data.email}`);
        const updated = await this.prisma.user.update({
          where: { email: data.email },
          data: {
            supabaseAuthId: data.supabaseAuthId,
            status: 'ACTIVE',
            // Si entra por Google y su correo ya estaba pendiente de verificar
            // por el flujo de código, Google ya nos ahorró ese paso.
            ...(data.emailVerified ? { emailVerified: true } : {}),
          },
        });
        return updated;
      }

      // 3. Crear el usuario nuevo — siempre como CUSTOMER, el rol nunca viene del cliente.
      // emailVerified empieza en false (se confirma con el código que se envía aparte),
      // salvo que el proveedor ya lo haya verificado (Google).
      const user = await this.prisma.user.create({
        data: {
          supabaseAuthId: data.supabaseAuthId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: !!data.emailVerified,
        },
      });

      this.logger.log(`Usuario registrado exitosamente: ${data.email}`);
      return user;
    } catch (err: any) {
      this.logger.error(`Error en registerUser para ${data.email}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Genera un código de 6 dígitos, guarda su hash (nunca el código en claro)
   * y lo envía por Resend. El código en sí jamás sale de este método.
   */
  async generateAndSendVerificationCode(email: string): Promise<{ success: boolean; alreadyVerified?: boolean; error?: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // No revelamos si el correo existe o no.
      return { success: true };
    }

    if (user.emailVerified) {
      return { success: true, alreadyVerified: true };
    }

    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('RESEND_FROM_EMAIL');
    if (!apiKey || !from) {
      this.logger.error('RESEND_API_KEY/RESEND_FROM_EMAIL no configurados.');
      return { success: false, error: 'El envío de correos no está configurado.' };
    }

    const code = randomInt(100000, 1000000).toString();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: hashCode(code),
        verificationCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
        verificationAttempts: 0,
      },
    });

    const emailResult = await sendVerificationCodeEmail({
      to: user.email,
      firstName: user.firstName,
      code,
      apiKey,
      from,
    });

    if (!emailResult.success) {
      this.logger.error(`No se pudo enviar el código de verificación a ${email}: ${emailResult.error}`);
      return { success: false, error: 'No pudimos enviar el correo. Intenta nuevamente en unos minutos.' };
    }

    return { success: true };
  }

  /**
   * Compara el código ingresado contra el hash guardado. Bloquea tras
   * MAX_VERIFICATION_ATTEMPTS intentos fallidos hasta que se pida un código nuevo.
   */
  async verifyEmailCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { success: false, error: 'No encontramos una cuenta con ese correo.' };
    }

    if (user.emailVerified) {
      return { success: true };
    }

    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      return { success: false, error: 'No hay un código pendiente. Solicita uno nuevo.' };
    }

    if (user.verificationCodeExpiresAt.getTime() < Date.now()) {
      return { success: false, error: 'Tu código venció. Solicita uno nuevo.' };
    }

    if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      return { success: false, error: 'Demasiados intentos fallidos. Solicita un código nuevo.' };
    }

    const providedHash = hashCode(code.trim());
    const storedHash = user.verificationCode;

    // Longitud fija (hex de sha256) así que timingSafeEqual es seguro aquí.
    const matches =
      providedHash.length === storedHash.length &&
      timingSafeEqual(Buffer.from(providedHash), Buffer.from(storedHash));

    if (!matches) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { verificationAttempts: { increment: 1 } },
      });
      return { success: false, error: 'Código incorrecto.' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        verificationAttempts: 0,
      },
    });

    return { success: true };
  }
}
