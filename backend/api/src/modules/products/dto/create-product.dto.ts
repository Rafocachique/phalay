import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsEnum, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  collectionIds?: string[];

  // El stock se administra por combinación de talla/color. Se mantiene como
  // objeto flexible para no bloquear tallas como "4", "10" o "Dama M".
  @IsArray()
  @IsOptional()
  variants?: Array<{
    size?: string;
    color?: string;
    colorHex?: string;
    stock?: number;
  }>;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stock?: number;
}
