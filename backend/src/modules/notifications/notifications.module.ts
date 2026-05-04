import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LabOrder } from '../lab/lab-order.entity';
import { LabResult } from '../lab/lab-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Appointment, LabOrder, LabResult])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
