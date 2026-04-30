import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.id, req.user.role);
  }

  @Post()
  create(@Body() dto: any, @Request() req: any) {
    return this.service.create(dto, req.user.id, req.user.role);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    const data = await this.service.updateStatus(id, status, req.user.id, req.user.role);
    return { success: true, data };
  }

  @Patch(':id/notes')
  async updateNotes(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Request() req: any,
  ) {
    const allowed: any = {};
    if (body.notes       !== undefined) allowed.notes       = body.notes;
    if (body.examination !== undefined) allowed.examination = body.examination;
    const data = await this.service.updateAppointmentData(id, allowed);
    return { success: true, data };
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.remove(id, req.user.id, req.user.role);
  }
}
