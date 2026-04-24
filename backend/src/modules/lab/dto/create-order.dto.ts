import { IsNumber, IsOptional, IsEnum, IsString } from 'class-validator';
import { OrderPriority } from '../lab-order.entity';

export class CreateOrderDto {
  @IsNumber()
  patientId: number;

  @IsOptional()
  @IsNumber()
  appointmentId?: number;

  @IsNumber()
  testId: number;

  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @IsOptional()
  @IsString()
  clinicalInfo?: string;

  @IsOptional()
  @IsString()
  scheduledAt?: string;
}
