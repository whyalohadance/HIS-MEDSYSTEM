import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsNumber()
  @IsOptional()
  floor?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
