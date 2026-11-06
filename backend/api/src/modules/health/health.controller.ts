import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Verificar estado de la API' })
  check() {
    return {
      success: true,
      data: {
        status: 'ok',
        service: 'PHALAY API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
