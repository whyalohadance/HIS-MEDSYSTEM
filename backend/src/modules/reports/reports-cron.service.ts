import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportsCronService {
  private readonly logger = new Logger(ReportsCronService.name);

  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  // 1-го числа каждого месяца в 9:00 утра
  @Cron('0 9 1 * *')
  async notifyAdminsMonthlyReport() {
    this.logger.log('Отправка уведомлений о месячном отчёте...');

    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь',
      'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

    const admins = await this.usersRepo.find({ where: { role: UserRole.ADMIN } });

    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        title: '📊 Месячный отчёт готов',
        message: `Отчёт за ${monthNames[prevMonth - 1]} ${prevYear} готов к скачиванию. Не забудьте отправить его в бухгалтерию!`,
      });
    }

    this.logger.log(`Уведомлено ${admins.length} администраторов`);
  }
}
