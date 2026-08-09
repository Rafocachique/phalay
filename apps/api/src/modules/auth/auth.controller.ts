import { Controller, Post, Get, Patch, Body, HttpCode, HttpStatus, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';
import { GetUser } from './get-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario (siempre como CUSTOMER)' })
  async register(
    @Body() body: {
      supabaseAuthId: string;
      email: string;
      firstName: string;
      lastName: string;
      emailVerified?: boolean;
    },
  ) {
    try {
      // El registro público nunca acepta el rol del cliente: siempre se crea como CUSTOMER.
      // Los roles ADMIN/SUPER_ADMIN sólo se otorgan vía PATCH /users/:id por un SUPER_ADMIN.
      const user = await this.authService.registerUser(body);
      return {
        success: true,
        data: user,
        message: 'Usuario registrado exitosamente',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      throw new BadRequestException({
        success: false,
        message: err.message || 'Error al registrar el usuario',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Perfil de la clienta autenticada. El checkout lo usa para prellenar sus
   * datos (incluido el DNI ya registrado) y no volver a pedírselos.
   */
  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  async me(@GetUser() user: any) {
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        dni: user.dni,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Cada usuario edita SU PROPIO nombre. No toca rol ni estado: eso sigue
   * siendo exclusivo del SUPER_ADMIN desde Equipo/Usuarios.
   */
  @Patch('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el perfil propio (nombre y apellido)' })
  async updateMe(
    @GetUser() user: any,
    @Body() body: { firstName?: string; lastName?: string },
  ) {
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();

    if (!firstName || !lastName) {
      throw new BadRequestException({ success: false, message: 'Nombre y apellido son obligatorios.' });
    }

    const updated = await this.authService.updateOwnProfile(user.id, { firstName, lastName });
    return { success: true, data: updated, message: 'Perfil actualizado' };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar token JWT' })
  async verify(@Body() body: { token: string }) {
    const user = await this.authService.verifyToken(body.token);
    return {
      success: !!user,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('send-verification-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar (o reenviar) el código de verificación de cuenta por correo' })
  async sendVerificationCode(@Body() body: { email: string }) {
    if (!body?.email) {
      throw new BadRequestException({ success: false, message: 'Falta el correo electrónico.' });
    }
    const result = await this.authService.generateAndSendVerificationCode(body.email);
    if (!result.success) {
      throw new BadRequestException({ success: false, message: result.error });
    }
    return { success: true, alreadyVerified: !!result.alreadyVerified, timestamp: new Date().toISOString() };
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar la cuenta con el código de 6 dígitos' })
  async verifyCode(@Body() body: { email: string; code: string }) {
    if (!body?.email || !body?.code) {
      throw new BadRequestException({ success: false, message: 'Falta el correo o el código.' });
    }
    const result = await this.authService.verifyEmailCode(body.email, body.code);
    if (!result.success) {
      throw new BadRequestException({ success: false, message: result.error });
    }
    return { success: true, timestamp: new Date().toISOString() };
  }
}
