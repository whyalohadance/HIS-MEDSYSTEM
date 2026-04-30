export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  roomId?: number;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  duration?: number;
  status: AppointmentStatus;
  notes?: string;
  examination?: string;
  price?: number;
  completedAt?: string;
  createdAt: string;
}
