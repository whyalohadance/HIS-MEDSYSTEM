import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { User } from '../users/user.entity';
import { Patient } from '../patients/patient.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Study } from '../studies/study.entity';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule.forFeature([User, Patient, Appointment, Study]),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
