export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  roomId?: number;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  price?: number;
  createdAt: string;
}
