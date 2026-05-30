import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { AuditService, AuditFilters } from './audit.service';
import { AuditAction } from './audit-log.entity';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: any) {
    const filters: AuditFilters = {
      userId:    query.userId    ? Number(query.userId) : undefined,
      action:    query.action    ? (query.action as AuditAction) : undefined,
      resource:  query.resource  || undefined,
      search:    query.search    || undefined,
      startDate: query.startDate || undefined,
      endDate:   query.endDate   || undefined,
      page:      query.page      ? Number(query.page)  : 1,
      limit:     query.limit     ? Number(query.limit) : 20,
    };
    return this.auditService.findAll(filters);
  }

  @Get('stats')
  stats() {
    return this.auditService.getStats();
  }

  @Get('export')
  async exportCsv(@Query() query: any, @Res() res: Response) {
    const filters: AuditFilters = {
      userId:    query.userId    ? Number(query.userId) : undefined,
      action:    query.action    ? (query.action as AuditAction) : undefined,
      resource:  query.resource  || undefined,
      search:    query.search    || undefined,
      startDate: query.startDate || undefined,
      endDate:   query.endDate   || undefined,
    };
    const csv = await this.auditService.exportCsv(filters);
    const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
  }
}
