import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

const SAFE_FIELDS: (keyof User)[] = ['id', 'firstName', 'lastName', 'email', 'role', 'phone', 'roomId', 'specialization', 'isActive', 'createdAt', 'updatedAt'];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
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
}
