import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * Guard que valida JWT de Supabase en las rutas protegidas
 * Uso: @UseGuards(JwtGuard)
 */
@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.authService.verifyToken(token);

    if (!user) {
      throw new UnauthorizedException('Token inválido o usuario no existe');
    }

    // Una cuenta desactivada o suspendida no debe poder seguir operando con un
    // token emitido antes: sin esta comprobación, el panel la bloquea pero la
    // API seguiría aceptando todas sus peticiones.
    if (user.status !== 'ACTIVE') {
      this.logger.warn(`Acceso denegado a usuario no activo: ${user.email} (${user.status})`);
      throw new UnauthorizedException('Tu cuenta no está activa. Contacta al administrador.');
    }

    // Adjuntar el usuario al request para usarlo en el controller
    request.user = user;
    return true;
  }
}
