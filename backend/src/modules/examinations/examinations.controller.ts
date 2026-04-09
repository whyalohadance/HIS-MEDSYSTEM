import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ExaminationsService } from './examinations.service';
import { CreateExaminationDto } from './dto/create-examination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('examinations')
@Controller('examinations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExaminationsController {
  constructor(private service: ExaminationsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  create(@Body() dto: CreateExaminationDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateExaminationDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { message: 'Обследование удалено' };
  }
}
