import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Decorador para especificar qué roles pueden acceder a una ruta
 * Uso: @Roles(['ADMIN', 'SELLER'])
 */
export const Roles = Reflector.createDecorator<string[]>();

/**
 * Guard que valida si el usuario tiene uno de los roles requeridos
 * Uso: @UseGuards(RolesGuard)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // IMPORTANTE: con Reflector.createDecorator() la metadata se guarda bajo
    // una clave interna única del propio decorador `Roles`, no bajo un string.
    // Hay que pasar el decorador (`Roles`) a reflector.get(), no una clave string,
    // o el guard nunca encuentra los roles requeridos y deja pasar a cualquiera.
    const requiredRoles = this.reflector.get(Roles, context.getHandler());

    if (!requiredRoles) {
      // Si no hay roles especificados, permitir acceso
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    const hasRole = requiredRoles.some((role: string) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }

    return true;
  }
}
