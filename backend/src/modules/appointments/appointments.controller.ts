import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppointmentStatus } from './appointment.entity';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.id, req.user.role);
  }

  @Post()
  create(@Body() dto: any, @Request() req) {
    return this.service.create(dto, req.user.id, req.user.role);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: AppointmentStatus,
    @Request() req,
  ) {
    return this.service.updateStatus(id, status, req.user.id, req.user.role);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.remove(id, req.user.id, req.user.role);
  }
}
