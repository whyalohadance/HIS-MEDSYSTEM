import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateExaminationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
