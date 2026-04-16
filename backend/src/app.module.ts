import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { User } from './modules/users/user.entity';
import { Patient } from './modules/patients/patient.entity';
import { Appointment } from './modules/appointments/appointment.entity';
import { Result } from './modules/results/result.entity';
import { Notification } from './modules/notifications/notification.entity';
import { Review } from './modules/reviews/review.entity';
import { Room } from './modules/rooms/room.entity';
import { Examination } from './modules/examinations/examination.entity';
import { Schedule } from './modules/schedules/schedule.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ResultsModule } from './modules/results/results.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { UploadModule } from './modules/upload/upload.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StudiesModule } from './modules/studies/studies.module';
import { Study } from './modules/studies/study.entity';
import { Modality } from './modules/studies/modality.entity';
import { Series } from './modules/studies/series.entity';
import { DicomImage } from './modules/studies/dicom-image.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [User, Patient, Appointment, Result, Notification, Review, Room, Examination, Schedule, Study, Modality, Series, DicomImage],
        synchronize: true,
        logging: false,
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([{
        ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
        limit: config.get<number>('THROTTLE_LIMIT', 100),
      }]),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    PatientsModule,
    AppointmentsModule,
    ResultsModule,
    NotificationsModule,
    ReviewsModule,
    RoomsModule,
    ExaminationsModule,
    SchedulesModule,
    UploadModule,
    ReportsModule,
    StudiesModule,
    TypeOrmModule.forFeature([User, Patient, Appointment, Review]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
  ],
})
export class AppModule {}
