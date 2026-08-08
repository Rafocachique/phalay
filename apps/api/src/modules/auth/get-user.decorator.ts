import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para extraer el usuario autenticado del request
 * Uso: @GetUser() user: User
 */
export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
