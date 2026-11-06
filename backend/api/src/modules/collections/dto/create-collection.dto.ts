import { IsString, IsOptional, IsUrl, IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  productIds?: string[];
}
