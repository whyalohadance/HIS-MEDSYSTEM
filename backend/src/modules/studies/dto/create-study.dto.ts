import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { StudyType, StudyPriority } from '../study.entity';

export class CreateStudyDto {
  @IsNumber()
  patientId: number;

  @IsOptional()
  @IsNumber()
  appointmentId?: number;

  @IsOptional()
  @IsNumber()
  referringDoctorId?: number;

  @IsEnum(StudyType)
  type: StudyType;

  @IsOptional()
  @IsEnum(StudyPriority)
  priority?: StudyPriority;

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
}
