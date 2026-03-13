import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { AppointmentStatus } from '../appointment.entity';

export class CreateAppointmentDto {
  @IsNumber()
  patientId: number;

  @IsString()
  date: string;

  @IsString()
  time: string;

  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
