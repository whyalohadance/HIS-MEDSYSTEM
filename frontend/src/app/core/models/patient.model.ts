export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  address?: string;
  doctorId: number;
  createdAt: string;
}
