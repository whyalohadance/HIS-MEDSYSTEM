import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateResultDto {
  @IsNumber()
  patientId: number;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileName?: string;
}
