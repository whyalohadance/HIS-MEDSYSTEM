export type NotificationType =
  | 'appointment_reminder'
  | 'lab_result_ready'
  | 'lab_critical'
  | 'study_report_ready'
  | 'monthly_report'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
