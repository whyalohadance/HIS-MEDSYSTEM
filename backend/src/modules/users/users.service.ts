import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

const SAFE_FIELDS: (keyof User)[] = ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'roomId', 'specialization', 'isActive', 'createdAt', 'updatedAt'];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.repo.findOne({ where: { id }, select: SAFE_FIELDS });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.repo.find({ select: SAFE_FIELDS, order: { createdAt: 'DESC' } });
  }

  async findByRole(role: string): Promise<User[]> {
    return this.repo.find({
      where: { role: role as any },
      select: SAFE_FIELDS,
      order: { lastName: 'ASC' }
    });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async updateById(id: number, data: Partial<User>): Promise<User> {
    const allowed = ['firstName', 'lastName', 'phone', 'roomId'];
    const filtered: any = {};
    allowed.forEach(k => { if ((data as any)[k] !== undefined) filtered[k] = (data as any)[k]; });
    await this.repo.update(id, filtered);
    return this.findById(id);
  }

  async adminUpdateById(id: number, data: any): Promise<User> {
    const allowed = ['firstName', 'lastName', 'email', 'phone', 'role', 'roomId', 'specialization', 'isActive'];
    const filtered: any = {};
    allowed.forEach(k => { if (data[k] !== undefined) filtered[k] = data[k]; });
    if (data.password && data.password.length >= 6) {
      filtered.password = await bcrypt.hash(data.password, 10);
    }
    await this.repo.update(id, filtered);
    return this.findById(id);
  }

  async deleteById(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async getStaffStats() {
    const allUsers = await this.repo.find();
    const byRole: any = {};
    for (const u of allUsers) {
      byRole[u.role] = (byRole[u.role] || 0) + 1;
    }
    return {
      total: allUsers.length,
      active: allUsers.filter(u => u.isActive !== false).length,
      inactive: allUsers.filter(u => u.isActive === false).length,
      byRole,
    };
  }

  async getStaffWithActivity() {
    const users = await this.repo.find({ order: { lastName: 'ASC' } });
    const today = new Date().toISOString().split('T')[0];
    const result: any[] = [];

    for (const u of users) {
      let todayCount = 0;
      let weekCount = 0;

      if (u.role === 'doctor') {
        const todayAppts = await this.dataSource.query(
          `SELECT COUNT(*) as cnt FROM appointments WHERE "doctorId" = $1 AND date = $2`,
          [u.id, today],
        );
        todayCount = parseInt(todayAppts[0]?.cnt || '0');
        const weekAppts = await this.dataSource.query(
          `SELECT COUNT(*) as cnt FROM appointments WHERE "doctorId" = $1 AND "createdAt" >= NOW() - INTERVAL '7 days'`,
          [u.id],
        );
        weekCount = parseInt(weekAppts[0]?.cnt || '0');
      }

      if (u.role === 'radiologist') {
        const todayStudies = await this.dataSource.query(
          `SELECT COUNT(*) as cnt FROM studies WHERE "radiologistId" = $1 AND "createdAt"::date = $2::date`,
          [u.id, today],
        );
        todayCount = parseInt(todayStudies[0]?.cnt || '0');
        const weekStudies = await this.dataSource.query(
          `SELECT COUNT(*) as cnt FROM studies WHERE "radiologistId" = $1 AND "createdAt" >= NOW() - INTERVAL '7 days'`,
          [u.id],
        );
        weekCount = parseInt(weekStudies[0]?.cnt || '0');
      }

      if (u.role === 'lab_technician') {
        const todayOrders = await this.dataSource.query(
          `SELECT COUNT(*) as cnt FROM lab_orders WHERE "labTechnicianId" = $1 AND "createdAt"::date = $2::date`,
          [u.id, today],
        );
        todayCount = parseInt(todayOrders[0]?.cnt || '0');
        const weekOrders = await this.dataSource.query(
          `SELECT COUNT(*) as cnt FROM lab_orders WHERE "labTechnicianId" = $1 AND "createdAt" >= NOW() - INTERVAL '7 days'`,
          [u.id],
        );
        weekCount = parseInt(weekOrders[0]?.cnt || '0');
      }

      if (u.role === 'receptionist') {
        const todayAppts = await this.dataSource.query(
          `SELECT COUNT(*) as cnt FROM appointments WHERE "createdAt"::date = $1::date`,
          [today],
        );
        todayCount = parseInt(todayAppts[0]?.cnt || '0');
      }

      result.push({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        phone: u.phone,
        roomId: u.roomId,
        specialization: u.specialization,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        todayCount,
        weekCount,
      });
    }

    return result;
  }
}
