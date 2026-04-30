import { Injectable, NotFoundException } from '@nestjs/common';
import { Appointment } from '../appointments/appointment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { User } from '../users/user.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private repo: Repository<Room>,
    @InjectRepository(Appointment)
    private appointmentsRepo: Repository<Appointment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<Room[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findActive(): Promise<Room[]> {
    return this.repo.find({ where: { isActive: true }, order: { type: 'ASC', number: 'ASC' } });
  }

  async findByType(type?: string): Promise<Room[]> {
    const where: any = { isActive: true };
    if (type) where.type = type;
    return this.repo.find({ where, order: { number: 'ASC' } });
  }

  async findOne(id: number): Promise<Room> {
    const room = await this.repo.findOne({ where: { id } });
    if (!room) throw new NotFoundException('Кабинет не найден');
    return room;
  }

  async create(dto: CreateRoomDto): Promise<Room> {
    const room = this.repo.create(dto);
    return this.repo.save(room);
  }

  async update(id: number, dto: Partial<CreateRoomDto>): Promise<Room> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async getAvailableDoctorsForRoom(roomId: number, date: string, time?: string): Promise<any[]> {
    const room = await this.repo.findOne({ where: { id: roomId } });
    if (!room || !room.assignedDoctorIds || room.assignedDoctorIds.length === 0) return [];

    const doctors = await this.userRepo.find({ where: { id: In(room.assignedDoctorIds) } });

    const busyAppointments = await this.appointmentsRepo.find({ where: { date, roomId } });

    return doctors.map(doctor => {
      const doctorApts = busyAppointments.filter(a => a.doctorId === doctor.id);
      const isAtSpecificTime = time
        ? busyAppointments.some(a => a.doctorId === doctor.id && a.time === time)
        : false;
      return {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        busyCount: doctorApts.length,
        isAvailable: !isAtSpecificTime && doctorApts.length < 8,
        busySlots: doctorApts.map(a => a.time),
      };
    });
  }

  async findAvailable(date: string, time: string): Promise<Room[]> {
    const allRooms = await this.repo.find({ order: { name: 'ASC' } });
    if (!date || !time) return allRooms;

    const busyAppointments = await this.appointmentsRepo.find({
      where: { date, time }
    });

    const busyRoomIds = busyAppointments
      .filter(a => a.roomId)
      .map(a => a.roomId);

    return allRooms.filter(r => !busyRoomIds.includes(r.id));
  }
}
