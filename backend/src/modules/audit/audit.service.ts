import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

export interface AuditFilters {
  userId?: number;
  action?: AuditAction;
  resource?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>): Promise<void> {
    try {
      const entry = this.repo.create(data);
      await this.repo.save(entry);
    } catch (err) {
      console.error('[AuditService] Failed to write audit log:', err?.message);
    }
  }

  async findAll(filters: AuditFilters) {
    const page  = Math.max(1, Number(filters.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip  = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    this.applyFilters(qb, filters);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map(item => ({
        id: item.id,
        action: item.action,
        resource: item.resource,
        resourceId: item.resourceId,
        method: item.method,
        endpoint: item.endpoint,
        ip: item.ip,
        description: item.description,
        success: item.success,
        errorMessage: item.errorMessage,
        createdAt: item.createdAt,
        user: item.user
          ? { id: item.user.id, firstName: item.user.firstName, lastName: item.user.lastName, email: item.user.email, role: item.user.role }
          : null,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalActions, todayActions] = await Promise.all([
      this.repo.count(),
      this.repo.createQueryBuilder('log')
        .where('log.createdAt >= :today', { today })
        .getCount(),
    ]);

    const byAction = await this.repo
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .getRawMany();

    const byUser = await this.repo
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .select('log.userId', 'userId')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .addSelect('user.email', 'email')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId IS NOT NULL')
      .groupBy('log.userId')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .addGroupBy('user.email')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalActions,
      todayActions,
      byAction: byAction.map(r => ({ action: r.action, count: Number(r.count) })),
      byUser:   byUser.map(r => ({
        userId: r.userId,
        name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.email,
        email: r.email,
        count: Number(r.count),
      })),
    };
  }

  async exportCsv(filters: AuditFilters): Promise<string> {
    const qb = this.repo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .take(5000); // cap at 5000 rows for export

    this.applyFilters(qb, filters);
    const items = await qb.getMany();

    const escape = (v: any) => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const headers = ['ID', 'Timestamp', 'User', 'Email', 'Action', 'Resource', 'ResourceID', 'Method', 'Endpoint', 'IP', 'Success', 'Description', 'Error'];
    const rows = items.map(r => [
      r.id,
      r.createdAt?.toISOString(),
      r.user ? `${r.user.firstName} ${r.user.lastName}` : '',
      r.user?.email || '',
      r.action,
      r.resource,
      r.resourceId ?? '',
      r.method,
      r.endpoint,
      r.ip || '',
      r.success ? 'YES' : 'NO',
      r.description || '',
      r.errorMessage || '',
    ].map(escape).join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }

  private applyFilters(qb: SelectQueryBuilder<AuditLog>, filters: AuditFilters) {
    if (filters.userId) {
      qb.andWhere('log.userId = :userId', { userId: Number(filters.userId) });
    }
    if (filters.action) {
      qb.andWhere('log.action = :action', { action: filters.action });
    }
    if (filters.resource) {
      qb.andWhere('log.resource ILIKE :resource', { resource: `%${filters.resource}%` });
    }
    if (filters.search) {
      qb.andWhere(
        '(log.resource ILIKE :s OR log.endpoint ILIKE :s OR log.description ILIKE :s)',
        { s: `%${filters.search}%` },
      );
    }
    if (filters.startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('log.createdAt <= :endDate', { endDate: end });
    }
  }
}
