import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('rooms')
@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomsController {
  constructor(private service: RoomsService) {}

  @Get()
  async findAll() {
    const data = await this.service.findAll();
    return { success: true, data };
  }

  @Get('active')
  async findActive() {
    const data = await this.service.findActive();
    return { success: true, data };
  }

  @Get('by-type')
  async getByType(@Query('type') type: string) {
    const data = await this.service.findByType(type);
    return { success: true, data };
  }

  @Get('available')
  findAvailable(@Query('date') date: string, @Query('time') time: string) {
    return this.service.findAvailable(date, time);
  }

  @Get(':id/available-doctors')
  async getAvailableDoctors(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
    @Query('time') time: string,
  ) {
    const data = await this.service.getAvailableDoctorsForRoom(id, date, time);
    return { success: true, data };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateRoomDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateRoomDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { message: 'Кабинет удалён' };
  }
}
