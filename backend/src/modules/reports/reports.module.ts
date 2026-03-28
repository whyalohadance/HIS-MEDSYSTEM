import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportsCronService } from './reports-cron.service';
import { Appointment } from '../appointments/appointment.entity';
import { Patient } from '../patients/patient.entity';
import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Patient, User, Room]),
    NotificationsModule,
  ],
  providers: [ReportsService, ReportsCronService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
