import { ApiTags } from '@nestjs/swagger';
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, Request, ParseIntPipe
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('patients')
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private service: PatientsService) {}

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.id, req.user.role);
  }

  @Post()
  create(@Body() dto: CreatePatientDto, @Request() req) {
    return this.service.create(dto, req.user.id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreatePatientDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { message: 'Пациент удалён' };
  }
}
