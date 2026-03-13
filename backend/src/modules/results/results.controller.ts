import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('results')
@UseGuards(JwtAuthGuard)
export class ResultsController {
  constructor(private service: ResultsService) {}

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.id, req.user.role);
  }

  @Post()
  create(@Body() dto: any, @Request() req) {
    return this.service.create(dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.service.remove(id, req.user.id, req.user.role);
    return { message: 'Результат удалён' };
  }
}
