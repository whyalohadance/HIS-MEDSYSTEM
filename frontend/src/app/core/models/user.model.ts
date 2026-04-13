export type UserRole = 'admin' | 'doctor' | 'patient' | 'receptionist' | 'radiologist';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  roomId?: number;
  createdAt?: string;
}
