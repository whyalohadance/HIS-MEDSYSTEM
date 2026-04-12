import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { StudyStatus } from '../study.entity';

export class UpdateStudyDto {
  @IsOptional()
  @IsEnum(StudyStatus)
  status?: StudyStatus;

  @IsOptional()
  @IsString()
  findings?: string;

  @IsOptional()
  @IsString()
  conclusion?: string;

  @IsOptional()
  @IsNumber()
  radiologistId?: number;

  @IsOptional()
  @IsString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  bodyPart?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  clinicalInfo?: string;

  @IsOptional()
  @IsNumber()
  modalityId?: number;

  @IsOptional()
  @IsNumber()
  roomId?: number;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  price?: number;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
