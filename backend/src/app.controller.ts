import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RolesGuard, Roles } from './common/guards/roles.guard';
import { UserRole, User } from './modules/users/user.entity';
import { Patient } from './modules/patients/patient.entity';
import { Appointment } from './modules/appointments/appointment.entity';
import { Review } from './modules/reviews/review.entity';

@Controller()
export class AppController {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Patient) private patientsRepo: Repository<Patient>,
    @InjectRepository(Appointment) private appointmentsRepo: Repository<Appointment>,
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
  ) {}

  @Get('health')
  async health() {
    let dbStatus = 'down';
    let tablesCount = 0;

    try {
      if (this.dataSource.isInitialized) {
        const result = await this.dataSource.query(
          `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'`
        );
        tablesCount = parseInt(result[0]?.count || '0', 10);
        dbStatus = tablesCount > 0 ? 'ok' : 'no-tables';
      }
    } catch (e) {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      service: 'MedSystem API',
      version: '1.0.0',
      database: dbStatus,
      tables: tablesCount,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminStats() {
    const totalPatients    = await this.patientsRepo.count();
    const totalDoctors     = await this.usersRepo.count({ where: { role: UserRole.DOCTOR } });
    const totalReceptionists = await this.usersRepo.count({ where: { role: UserRole.RECEPTIONIST } });
    const totalAppointments  = await this.appointmentsRepo.count();
    const completedAppointments = await this.appointmentsRepo.count({ where: { status: 'completed' as any } });
    const scheduledAppointments = await this.appointmentsRepo.count({ where: { status: 'scheduled' as any } });
    const cancelledAppointments = await this.appointmentsRepo.count({ where: { status: 'cancelled' as any } });
    const totalReviews  = await this.reviewsRepo.count();

    return {
      totalPatients,
      totalDoctors,
      totalReceptionists,
      totalAppointments,
      completedAppointments,
      scheduledAppointments,
      cancelledAppointments,
      totalReviews,
    };
  }
}
