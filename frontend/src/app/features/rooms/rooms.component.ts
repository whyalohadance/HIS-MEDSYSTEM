import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { map } from 'rxjs';

const TYPE_META: Record<string, { icon: string; bg: string; color: string; label: string }> = {
  consultation: { icon: 'medical_services', bg: '#e8f0fe', color: '#1a73e8', label: 'Консультация' },
  radiology:    { icon: 'radiology',         bg: '#ede9fe', color: '#7c3aed', label: 'Радиология' },
  laboratory:   { icon: 'biotech',            bg: '#d1fae5', color: '#059669', label: 'Лаборатория' },
  procedure:    { icon: 'vaccines',           bg: '#fce7f3', color: '#be185d', label: 'Процедурная' },
  surgery:      { icon: 'healing',            bg: '#fee2e2', color: '#dc2626', label: 'Хирургия' },
};

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent implements OnInit {
  rooms: any[] = [];
  isLoading = true;
  showModal = false;
  isSaving = false;
  editingRoom: any = null;
  filterType = 'all';

  allDoctors: any[] = [];
  allRadiologists: any[] = [];
  allLabTechs: any[] = [];

  form = this.emptyForm();
  newSvc = { name: '', price: 0, duration: 30 };

  readonly roomTypes = [
    { value: 'consultation', label: 'Консультация', icon: 'medical_services' },
    { value: 'radiology',    label: 'Радиология',   icon: 'radiology' },
    { value: 'laboratory',   label: 'Лаборатория',  icon: 'biotech' },
    { value: 'procedure',    label: 'Процедурная',  icon: 'vaccines' },
    { value: 'surgery',      label: 'Хирургия',     icon: 'healing' },
  ];

  readonly filterTabs = [
    { value: 'all',          label: 'Все',           icon: 'grid_view' },
    { value: 'consultation', label: 'Консультация',  icon: 'medical_services' },
    { value: 'radiology',    label: 'Радиология',    icon: 'radiology' },
    { value: 'laboratory',   label: 'Лаборатория',   icon: 'biotech' },
    { value: 'procedure',    label: 'Процедурная',   icon: 'vaccines' },
    { value: 'surgery',      label: 'Хирургия',      icon: 'healing' },
  ];

  constructor(private api: ApiService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
    this.loadStaff();
  }

  emptyForm() {
    return { number: '', name: '', type: 'consultation', floor: 1, isActive: true, assignedDoctorIds: [] as number[], services: [] as any[] };
  }

  load(): void {
    this.api.get<any>('/rooms').pipe(map(r => r.data)).subscribe({
      next: data => { this.rooms = data || []; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  loadStaff(): void {
    this.api.get<any>('/users').subscribe({
      next: res => {
        const all = res.data || [];
        this.allDoctors = all.filter((u: any) => u.role === 'doctor');
        this.allRadiologists = all.filter((u: any) => u.role === 'radiologist');
        this.allLabTechs = all.filter((u: any) => u.role === 'lab_technician');
        this.cdr.detectChanges();
      }
    });
  }

  get filteredRooms(): any[] {
    if (this.filterType === 'all') return this.rooms;
    return this.rooms.filter(r => r.type === this.filterType);
  }

  getTypeMeta(type: string) { return TYPE_META[type] || TYPE_META['consultation']; }

  getStaffNames(room: any): string[] {
    if (!room.assignedDoctorIds?.length) return [];
    const all = [...this.allDoctors, ...this.allRadiologists, ...this.allLabTechs];
    return room.assignedDoctorIds
      .map((id: number) => all.find(u => u.id === id))
      .filter(Boolean)
      .map((u: any) => `${u.firstName} ${u.lastName}`);
  }

  openCreate(): void {
    this.editingRoom = null;
    this.form = this.emptyForm();
    this.newSvc = { name: '', price: 0, duration: 30 };
    this.showModal = true;
  }

  openEdit(room: any): void {
    this.editingRoom = room;
    this.form = {
      number: room.number || '',
      name: room.name || '',
      type: room.type || 'consultation',
      floor: room.floor || 1,
      isActive: room.isActive !== false,
      assignedDoctorIds: [...(room.assignedDoctorIds || [])],
      services: JSON.parse(JSON.stringify(room.services || []))
    };
    this.newSvc = { name: '', price: 0, duration: 30 };
    this.showModal = true;
  }

  getAvailableStaff(): any[] {
    if (this.form.type === 'consultation') return this.allDoctors;
    if (this.form.type === 'radiology') return this.allRadiologists;
    if (this.form.type === 'laboratory') return this.allLabTechs;
    return [];
  }

  isDoctorSelected(id: number): boolean { return this.form.assignedDoctorIds.includes(id); }

  toggleDoctor(id: number): void {
    const arr = this.form.assignedDoctorIds;
    const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.push(id);
  }

  addService(): void {
    if (!this.newSvc.name || this.newSvc.price <= 0) {
      this.toast.error('Введи название и цену услуги');
      return;
    }
    this.form.services.push({ ...this.newSvc });
    this.newSvc = { name: '', price: 0, duration: 30 };
  }

  removeService(i: number): void { this.form.services.splice(i, 1); }

  saveRoom(): void {
    if (!this.form.name || this.isSaving) {
      if (!this.form.name) this.toast.error('Введи название кабинета');
      return;
    }
    this.isSaving = true;
    const req = this.editingRoom
      ? this.api.put<any>(`/rooms/${this.editingRoom.id}`, this.form)
      : this.api.post<any>('/rooms', this.form);
    req.subscribe({
      next: () => {
        this.isSaving = false;
        this.showModal = false;
        this.toast.success(this.editingRoom ? 'Кабинет обновлён' : 'Кабинет создан');
        this.load();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSaving = false;
        this.toast.error('Ошибка сохранения');
        this.cdr.detectChanges();
      }
    });
  }

  deleteRoom(id: number): void {
    if (!confirm('Удалить кабинет?')) return;
    this.api.delete(`/rooms/${id}`).subscribe({
      next: () => { this.toast.success('Кабинет удалён'); this.load(); }
    });
  }
}
