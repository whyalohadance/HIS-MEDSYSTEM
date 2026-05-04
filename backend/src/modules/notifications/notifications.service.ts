import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationType, NotificationPriority } from './notification.entity';
import { User, UserRole } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LabOrder, OrderStatus } from '../lab/lab-order.entity';
import { LabResult, ResultFlag } from '../lab/lab-result.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(LabOrder)
    private labOrderRepo: Repository<LabOrder>,
    @InjectRepository(LabResult)
    private labResultRepo: Repository<LabResult>,
  ) {}

  // ============ CRUD ============

  async create(data: Partial<Notification>): Promise<Notification> {
    const notif = this.notifRepo.create(data);
    return this.notifRepo.save(notif);
  }

  async createForRole(role: UserRole, data: Omit<Partial<Notification>, 'userId'>) {
    const users = await this.userRepo.find({ where: { role } });
    if (!users.length) return [];
    const notifs = users.map(u => this.notifRepo.create({ ...data, userId: u.id }));
    return this.notifRepo.save(notifs);
  }

  async findAll(userId: number): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async unreadCount(userId: number): Promise<{ count: number }> {
    const count = await this.notifRepo.count({ where: { userId, isRead: false } });
    return { count };
  }

  // kept for old controller compatibility
  async getUnreadCount(userId: number): Promise<number> {
    return this.notifRepo.count({ where: { userId, isRead: false } });
  }

  async markAsRead(id: number): Promise<{ success: boolean }> {
    await this.notifRepo.update(id, { isRead: true, readAt: new Date() });
    return { success: true };
  }

  async markAllAsRead(userId: number): Promise<{ success: boolean }> {
    await this.notifRepo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
    return { success: true };
  }

  async delete(id: number): Promise<{ success: boolean }> {
    await this.notifRepo.delete(id);
    return { success: true };
  }

  // ============ CRON JOBS ============

  /**
   * Reception — приёмы через 1 час.
   * Запускается каждые 5 минут.
   * Использует поле apt.notified чтобы не дублировать.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async notifyAppointmentsInOneHour() {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const targetTime = new Date(now.getTime() + 60 * 60 * 1000);
      const hh = String(targetTime.getHours()).padStart(2, '0');
      const mm = String(targetTime.getMinutes()).padStart(2, '0');
      const targetHHMM = `${hh}:${mm}`;

      const fiveMin = new Date(targetTime.getTime() + 5 * 60 * 1000);
      const fhh = String(fiveMin.getHours()).padStart(2, '0');
      const fmm = String(fiveMin.getMinutes()).padStart(2, '0');
      const fiveMinLater = `${fhh}:${fmm}`;

      const appointments = await this.appointmentRepo
        .createQueryBuilder('apt')
        .where('apt.date = :date', { date: today })
        .andWhere('apt.time >= :start', { start: targetHHMM })
        .andWhere('apt.time < :end', { end: fiveMinLater })
        .andWhere('apt.status = :status', { status: 'scheduled' })
        .andWhere('apt.notified = :notified', { notified: false })
        .getMany();

      if (!appointments.length) return;

      this.logger.log(`Appointment 1h-reminder: ${appointments.length} appointments`);

      const receptionists = await this.userRepo.find({ where: { role: UserRole.RECEPTIONIST } });

      for (const apt of appointments) {
        for (const r of receptionists) {
          await this.create({
            userId: r.id,
            type: NotificationType.APPOINTMENT_REMINDER,
            priority: NotificationPriority.HIGH,
            title: 'Приём через 1 час',
            message: `Приём в ${apt.time} · пациент #${apt.patientId}`,
            link: `/appointments`,
            metadata: { appointmentId: apt.id },
          });
        }
        // Отмечаем чтобы не посылать повторно
        await this.appointmentRepo.update(apt.id, { notified: true });
      }
    } catch (e) {
      this.logger.error('appointment-reminder cron error:', e.message);
    }
  }

  /**
   * Admin — последний день месяца в 9:00 → сформировать отчёт.
   * Запускается в 9:00 каждого 28-31 числа, проверяет последний ли это день.
   */
  @Cron('0 9 28-31 * *')
  async notifyMonthlyReport() {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (tomorrow.getMonth() === now.getMonth()) return; // не последний день

      const monthName = now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

      this.logger.log(`Monthly report reminder: ${monthName}`);

      await this.createForRole(UserRole.ADMIN, {
        type: NotificationType.MONTHLY_REPORT,
        priority: NotificationPriority.HIGH,
        title: 'Время сформировать отчёт',
        message: `Месяц ${monthName} заканчивается. Сформируйте отчёт за этот период.`,
        link: '/reports',
        metadata: { month: now.getMonth() + 1, year: now.getFullYear() },
      });
    } catch (e) {
      this.logger.error('monthly-report cron error:', e.message);
    }
  }

  /**
   * Lab Technician + Doctor — критические результаты.
   * Запускается каждые 2 минуты, ищет результаты за последние 5 минут.
   */
  @Cron('*/2 * * * *')
  async notifyCriticalLabResults() {
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

      const criticals = await this.labResultRepo
        .createQueryBuilder('r')
        .where('r.createdAt >= :time', { time: fiveMinAgo })
        .andWhere('r.flag IN (:...flags)', {
          flags: [ResultFlag.CRITICAL_LOW, ResultFlag.CRITICAL_HIGH],
        })
        .getMany();

      if (!criticals.length) return;

      this.logger.log(`Critical lab results: ${criticals.length}`);

      const labTechs = await this.userRepo.find({ where: { role: UserRole.LAB_TECHNICIAN } });

      for (const result of criticals) {
        // Проверка дубликата через JSON path (PostgreSQL)
        const exists = await this.notifRepo
          .createQueryBuilder('n')
          .where('n.type = :type', { type: NotificationType.LAB_CRITICAL })
          .andWhere(`n.metadata->>'resultId' = :resultId`, { resultId: String(result.id) })
          .getOne();

        if (exists) continue;

        const order = await this.labOrderRepo.findOne({ where: { id: result.orderId } });
        if (!order) continue;

        const msgText = `${result.parameterName}: ${result.value}${result.unit ? ' ' + result.unit : ''} (норма: ${result.referenceRange || '—'})`;

        // Лаборантам
        for (const lt of labTechs) {
          await this.create({
            userId: lt.id,
            type: NotificationType.LAB_CRITICAL,
            priority: NotificationPriority.CRITICAL,
            title: '🚨 Критическое отклонение',
            message: msgText,
            link: `/lab/order/${order.id}`,
            metadata: { resultId: result.id, orderId: order.id, patientId: order.patientId },
          });
        }

        // Доктору
        if (order.doctorId) {
          await this.create({
            userId: order.doctorId,
            type: NotificationType.LAB_CRITICAL,
            priority: NotificationPriority.CRITICAL,
            title: '🚨 Критический результат у пациента',
            message: `Пациент #${order.patientId}: ${msgText}`,
            link: `/lab/order/${order.id}`,
            metadata: { resultId: result.id, orderId: order.id, patientId: order.patientId },
          });
        }
      }
    } catch (e) {
      this.logger.error('critical-results cron error:', e.message);
    }
  }

  /**
   * Doctor — результаты анализов его пациента готовы.
   * Запускается каждые 3 минуты.
   */
  @Cron('*/3 * * * *')
  async notifyDoctorAboutResults() {
    try {
      const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

      const completedOrders = await this.labOrderRepo
        .createQueryBuilder('o')
        .where('o.status = :status', { status: OrderStatus.COMPLETED })
        .andWhere('o.completedAt >= :time', { time: threeMinAgo })
        .getMany();

      if (!completedOrders.length) return;

      this.logger.log(`Doctor results notification: ${completedOrders.length} orders`);

      for (const order of completedOrders) {
        if (!order.doctorId) continue;

        const exists = await this.notifRepo
          .createQueryBuilder('n')
          .where('n.userId = :uid', { uid: order.doctorId })
          .andWhere('n.type = :type', { type: NotificationType.LAB_RESULT_READY })
          .andWhere(`n.metadata->>'orderId' = :orderId`, { orderId: String(order.id) })
          .getOne();

        if (exists) continue;

        const results = await this.labResultRepo.find({ where: { orderId: order.id } });
        const abnormal = results.filter(r => r.flag !== ResultFlag.NORMAL).length;

        await this.create({
          userId: order.doctorId,
          type: NotificationType.LAB_RESULT_READY,
          priority: abnormal > 0 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
          title: '🔬 Готовы результаты анализов',
          message: abnormal > 0
            ? `Пациент #${order.patientId}: ${order.orderNumber} · ${abnormal} отклонений`
            : `Пациент #${order.patientId}: ${order.orderNumber} · все в норме`,
          link: `/lab/order/${order.id}`,
          metadata: { orderId: order.id, patientId: order.patientId, abnormalCount: abnormal },
        });
      }
    } catch (e) {
      this.logger.error('doctor-results cron error:', e.message);
    }
  }

  /**
   * Очистка прочитанных уведомлений старше 7 дней — каждый день в 3:00.
   */
  @Cron('0 3 * * *')
  async cleanupOldNotifications() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await this.notifRepo
        .createQueryBuilder()
        .delete()
        .where('isRead = :read', { read: true })
        .andWhere('"readAt" < :date', { date: sevenDaysAgo })
        .execute();

      this.logger.log(`Cleanup: removed ${result.affected} old notifications`);
    } catch (e) {
      this.logger.error('cleanup cron error:', e.message);
    }
  }

  // ============ MANUAL TRIGGER (for testing) ============

  async triggerAllCrons() {
    await this.notifyAppointmentsInOneHour();
    await this.notifyMonthlyReport();
    await this.notifyCriticalLabResults();
    await this.notifyDoctorAboutResults();
  }
}
