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
  findAll() {
    return this.service.findAll();
  }

  @Get('available')
  findAvailable(@Query('date') date: string, @Query('time') time: string) {
    return this.service.findAvailable(date, time);
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
