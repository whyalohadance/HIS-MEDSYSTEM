export interface Review {
  id: number;
  patientId: number;
  doctorId: number;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
