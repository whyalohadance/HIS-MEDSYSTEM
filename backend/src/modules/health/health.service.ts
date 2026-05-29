import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Patient } from '../patients/patient.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Study } from '../studies/study.entity';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Patient)
    private patientsRepo: Repository<Patient>,
    @InjectRepository(Appointment)
    private appointmentsRepo: Repository<Appointment>,
    @InjectRepository(Study)
    private studiesRepo: Repository<Study>,
  ) {}

  async getStats() {
    const uptimeSeconds = Math.floor(process.uptime());
    const mem = process.memoryUsage();

    const usedMB  = Math.round(mem.heapUsed  / 1024 / 1024);
    const totalMB = Math.round(mem.heapTotal / 1024 / 1024);
    const rssMB   = Math.round(mem.rss       / 1024 / 1024);

    const [patients, appointments, users, studies] = await Promise.all([
      this.patientsRepo.count(),
      this.appointmentsRepo.count(),
      this.usersRepo.count(),
      this.studiesRepo.count(),
    ]);

    return {
      uptime: {
        seconds: uptimeSeconds,
        formatted: this.formatUptime(uptimeSeconds),
      },
      memory: {
        heapUsedMB:  usedMB,
        heapTotalMB: totalMB,
        rssMB,
        percent: totalMB > 0 ? Math.round((usedMB / totalMB) * 100) : 0,
      },
      counts: {
        patients,
        appointments,
        users,
        studies,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return parts.join(' ');
  }
}
