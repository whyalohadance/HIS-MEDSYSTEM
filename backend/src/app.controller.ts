import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RolesGuard, Roles } from './common/guards/roles.guard';
import { UserRole, User } from './modules/users/user.entity';
import { Patient } from './modules/patients/patient.entity';
import { Appointment } from './modules/appointments/appointment.entity';
import { Review } from './modules/reviews/review.entity';

@Controller()
export class AppController {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Patient) private patientsRepo: Repository<Patient>,
    @InjectRepository(Appointment) private appointmentsRepo: Repository<Appointment>,
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'MedSystem API', version: '1.0.0', timestamp: new Date() };
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
