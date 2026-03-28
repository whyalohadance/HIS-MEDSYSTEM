import { Injectable, NotFoundException } from '@nestjs/common';
import { Appointment } from '../appointments/appointment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private repo: Repository<Room>,
    @InjectRepository(Appointment)
    private appointmentsRepo: Repository<Appointment>,
  ) {}

  async findAll(): Promise<Room[]> {
    return this.repo.find({ order: { name: 'ASC' } });
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
