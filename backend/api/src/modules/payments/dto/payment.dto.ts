import { IsString, IsNotEmpty, IsNumber, Min, IsUUID, Matches, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStripeIntentDto {
  @ApiProperty({ description: 'Monto a cobrar', example: 150.50 })
  @IsNumber()
  @Min(0.5)
  amount!: number;

  @ApiProperty({ description: 'ID de la orden', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  orderId!: string;
}

export class GenerateYapePaymentDto {
  @ApiProperty({ description: 'ID de la orden', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  orderId!: string;
}

export class VerifyYapePaymentDto {
  @ApiProperty({ description: 'ID del Payment creado previamente', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  paymentId!: string;

  @ApiProperty({ description: 'Número de operación de Yape (6 a 8 dígitos numéricos)', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6,8}$/, { message: 'El código de aprobación debe tener entre 6 y 8 dígitos numéricos' })
  approvalCode!: string;

  @ApiProperty({ description: 'Número de celular desde donde se hizo el Yape', example: '999888777' })
  @IsString()
  @IsOptional()
  @Matches(/^9[0-9]{8}$/, { message: 'El número de celular debe ser peruano (9 dígitos, empezando con 9)' })
  phoneNumber?: string;
}
