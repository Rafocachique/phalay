import { Body, Controller, Get, Patch, Post, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ClaimsService } from './claims.service';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  /** Registro público del Libro de Reclamaciones. */
  @Post()
  create(@Body() body: any) { return this.claimsService.create(body); }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  findAll() { return this.claimsService.findAll(); }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPER_ADMIN'])
  @ApiBearerAuth()
  answer(@Param('id') id: string, @Body() body: { response?: string; status?: string }) {
    return this.claimsService.answer(id, body.response || '', body.status || 'PENDING');
  }
}
