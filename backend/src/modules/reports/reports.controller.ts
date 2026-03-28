import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('summary')
  async getSummary(@Query('month') month: string, @Query('year') year: string) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    return this.service.getReportData(m, y);
  }

  @Get('pdf')
  async downloadPDF(
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: Response
  ) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const buffer = await this.service.generatePDF(m, y);
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report_${monthNames[m-1]}_${y}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('excel')
  async downloadExcel(
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: Response
  ) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const buffer = await this.service.generateExcel(m, y);
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="report_${monthNames[m-1]}_${y}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
