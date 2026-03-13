export interface MedicalResult {
  id: number;
  patientId: number;
  doctorId: number;
  patientName: string;
  title: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
}
