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
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'ROOMS.TITLE' | translate }}</h1>
          <p class="page-sub">{{ rooms.length }} {{ 'ROOMS.COUNT' | translate }}</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <span class="material-icons">add</span> {{ 'COMMON.ADD' | translate }}
        </button>
      </div>

      <div class="loading" *ngIf="isLoading">
        <span class="material-icons spin">autorenew</span> {{ 'COMMON.LOADING' | translate }}
      </div>

      <div class="empty-state" *ngIf="!isLoading && rooms.length === 0">
        <span class="material-icons">meeting_room</span>
        <p>{{ 'ROOMS.NO_ROOMS' | translate }}</p>
      </div>

      <div class="grid" *ngIf="!isLoading && rooms.length > 0">
        <div class="room-card" *ngFor="let r of rooms">
          <div class="room-header">
            <div class="room-icon" [style.background]="getTypeMeta(r.type).bg">
              <span class="material-icons" [style.color]="getTypeMeta(r.type).color">{{ getTypeMeta(r.type).icon }}</span>
            </div>
            <div class="room-info">
              <div class="room-name">{{ r.name }}</div>
              <div class="room-sub">Каб. {{ r.number || '—' }} · Эт. {{ r.floor || '—' }} · {{ getTypeMeta(r.type).label }}</div>
            </div>
            <span class="badge" [class.active]="r.isActive" [class.inactive]="!r.isActive">
              {{ r.isActive ? 'Активен' : 'Неактивен' }}
            </span>
          </div>

          <div class="services-preview" *ngIf="r.services?.length">
            <span class="svc-pill" *ngFor="let s of r.services | slice:0:3">{{ $any(s).name }} — {{ $any(s).price }}₼</span>
            <span class="svc-more" *ngIf="r.services.length > 3">+{{ r.services.length - 3 }}</span>
          </div>

          <div class="room-actions">
            <button class="btn-action" (click)="openEdit(r)">
              <span class="material-icons">edit</span> Изменить
            </button>
            <button class="btn-action danger" (click)="deleteRoom(r.id)">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="showModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2><span class="material-icons">meeting_room</span> {{ editingRoom ? 'Редактировать кабинет' : 'Создать кабинет' }}</h2>
            <button class="btn-close" (click)="showModal = false"><span class="material-icons">close</span></button>
          </div>

          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Номер кабинета</label>
                <input type="text" [(ngModel)]="form.number" placeholder="101">
              </div>
              <div class="form-group">
                <label>Этаж</label>
                <input type="number" [(ngModel)]="form.floor" min="0" max="20">
              </div>
            </div>

            <div class="form-group">
              <label>Название кабинета *</label>
              <input type="text" [(ngModel)]="form.name" placeholder="Кабинет терапевта">
            </div>

            <div class="form-group">
              <label>Тип кабинета</label>
              <div class="type-selector">
                <label class="type-option" *ngFor="let t of roomTypes" [class.selected]="form.type === t.value">
                  <input type="radio" [(ngModel)]="form.type" [value]="t.value" (change)="form.assignedDoctorIds = []">
                  <span class="material-icons">{{ t.icon }}</span>
                  <span>{{ t.label }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Привязанный персонал</label>
              <div class="staff-list" *ngIf="getAvailableStaff().length > 0; else noStaff">
                <label class="staff-cb" *ngFor="let s of getAvailableStaff()" [class.sel]="isDoctorSelected(s.id)">
                  <input type="checkbox" [checked]="isDoctorSelected(s.id)" (change)="toggleDoctor(s.id)">
                  <span class="s-avatar" [class]="s.role">{{ s.firstName?.[0] }}{{ s.lastName?.[0] }}</span>
                  <span class="s-name">{{ s.firstName }} {{ s.lastName }}</span>
                  <span class="s-check material-icons" *ngIf="isDoctorSelected(s.id)">check</span>
                </label>
              </div>
              <ng-template #noStaff>
                <div class="empty-staff">Нет персонала для типа "{{ form.type }}"</div>
              </ng-template>
            </div>

            <div class="form-group">
              <label>Услуги и цены</label>
              <div class="services-list" *ngIf="form.services.length > 0">
                <div class="svc-row" *ngFor="let s of form.services; let i = index">
                  <span class="svc-n">{{ s.name }}</span>
                  <span class="svc-p">{{ s.price }} MDL</span>
                  <span class="svc-d">{{ s.duration }} мин</span>
                  <button class="btn-icon-sm danger" (click)="removeService(i)"><span class="material-icons">delete</span></button>
                </div>
              </div>
              <div class="add-svc-row">
                <input type="text" [(ngModel)]="newSvc.name" placeholder="Название услуги">
                <input type="number" [(ngModel)]="newSvc.price" placeholder="Цена">
                <input type="number" [(ngModel)]="newSvc.duration" placeholder="Мин">
                <button class="btn-add-svc" (click)="addService()"><span class="material-icons">add</span></button>
              </div>
            </div>

            <div class="form-group toggle-row">
              <label><input type="checkbox" [(ngModel)]="form.isActive"> Активен</label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="showModal = false">Отмена</button>
            <button class="btn-save" (click)="saveRoom()" [disabled]="isSaving">
              <span class="material-icons">check</span>
              {{ editingRoom ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 26px; font-weight: 700; color: #0f2d52; }
    .page-sub { font-size: 14px; color: #718096; margin-top: 4px; }
    .btn-primary { display: flex; align-items: center; gap: 8px; background: #1a73e8; color: white; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .loading { display: flex; align-items: center; gap: 8px; color: #718096; padding: 40px; justify-content: center; }
    .loading .material-icons { animation: spin 1s linear infinite; }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .empty-state { text-align: center; padding: 60px; color: #a0aec0; }
    .empty-state .material-icons { font-size: 48px; display: block; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
    .room-card { background: white; border-radius: 14px; padding: 18px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px; }
    .room-header { display: flex; align-items: center; gap: 12px; }
    .room-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .room-icon .material-icons { font-size: 20px; }
    .room-info { flex: 1; min-width: 0; }
    .room-name { font-size: 15px; font-weight: 600; color: #0f2d52; }
    .room-sub { font-size: 11px; color: #718096; margin-top: 2px; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
    .badge.active { background: #e6f4ea; color: #34a853; }
    .badge.inactive { background: #f4f6f9; color: #718096; }
    .services-preview { display: flex; flex-wrap: wrap; gap: 6px; }
    .svc-pill { padding: 4px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 11px; color: #475569; font-weight: 500; }
    .svc-more { padding: 4px 10px; background: #e8f0fe; border-radius: 20px; font-size: 11px; color: #1a73e8; font-weight: 600; }
    .room-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-action { display: flex; align-items: center; gap: 4px; padding: 7px 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-action:hover { background: #e2e8f0; }
    .btn-action.danger { color: #ef4444; }
    .btn-action.danger:hover { background: #fee2e2; }
    .btn-action .material-icons { font-size: 15px; }
    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(3px); }
    .modal-content { background: white; border-radius: 16px; max-width: 680px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
    .modal-header { padding: 18px 22px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 17px; display: flex; align-items: center; gap: 8px; color: #0f2d52; }
    .modal-header h2 .material-icons { font-size: 20px; color: #1a73e8; }
    .btn-close { background: transparent; border: none; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; }
    .btn-close:hover { background: #f1f5f9; }
    .modal-body { padding: 22px; overflow-y: auto; flex: 1; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
    .form-group > label:first-child { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; }
    .form-group input[type="text"], .form-group input[type="number"] { padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 14px; font-family: inherit; outline: none; }
    .form-group input:focus { border-color: #1a73e8; }
    .type-selector { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
    .type-option { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 12px 8px; border: 1.5px solid #e2e8f0; border-radius: 11px; cursor: pointer; transition: all 0.15s; background: white; }
    .type-option input[type="radio"] { display: none; }
    .type-option.selected { border-color: #1a73e8; background: #eff6ff; }
    .type-option .material-icons { font-size: 22px; color: #1a73e8; }
    .type-option span:last-child { font-size: 11px; font-weight: 600; color: #475569; text-align: center; }
    .staff-list { display: flex; flex-direction: column; gap: 5px; }
    .staff-cb { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px; cursor: pointer; transition: all 0.12s; }
    .staff-cb.sel { background: #d1fae5; border-color: #10b981; }
    .staff-cb input { display: none; }
    .s-avatar { width: 30px; height: 30px; border-radius: 50%; background: #1a73e8; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0; }
    .s-avatar.radiologist { background: #7c3aed; }
    .s-avatar.lab_technician { background: #059669; }
    .s-name { flex: 1; font-size: 13px; font-weight: 500; color: #1e293b; }
    .s-check { font-size: 16px; color: #10b981; }
    .empty-staff { padding: 12px 14px; background: #fef3c7; border-radius: 8px; font-size: 12px; color: #92400e; }
    .services-list { display: flex; flex-direction: column; gap: 5px; margin-bottom: 8px; }
    .svc-row { display: grid; grid-template-columns: 2fr 80px 70px 30px; gap: 8px; align-items: center; padding: 8px 10px; background: #f8fafc; border-radius: 7px; }
    .svc-n { font-size: 12px; font-weight: 500; color: #1e293b; }
    .svc-p { font-size: 12px; font-weight: 700; color: #047857; }
    .svc-d { font-size: 11px; color: #94a3b8; }
    .btn-icon-sm { background: transparent; border: none; cursor: pointer; padding: 3px; display: flex; align-items: center; }
    .btn-icon-sm.danger { color: #ef4444; }
    .btn-icon-sm .material-icons { font-size: 15px; }
    .add-svc-row { display: grid; grid-template-columns: 2fr 80px 70px 30px; gap: 6px; padding: 8px; background: #eff6ff; border-radius: 8px; }
    .add-svc-row input { padding: 6px 8px !important; font-size: 12px !important; border-radius: 6px !important; }
    .btn-add-svc { background: #1a73e8; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-add-svc .material-icons { font-size: 16px; }
    .toggle-row label { display: flex !important; align-items: center; gap: 8px; font-size: 14px !important; text-transform: none !important; letter-spacing: 0 !important; font-weight: 500 !important; color: #475569 !important; }
    .toggle-row input[type="checkbox"] { width: 16px; height: 16px; }
    .modal-footer { padding: 16px 22px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }
    .btn-cancel { padding: 10px 18px; background: #f1f5f9; color: #64748b; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-save { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: linear-gradient(135deg,#10b981,#059669); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class RoomsComponent implements OnInit {
  rooms: any[] = [];
  isLoading = true;
  showModal = false;
  isSaving = false;
  editingRoom: any = null;

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

  getTypeMeta(type: string) { return TYPE_META[type] || TYPE_META['consultation']; }

  openCreate(): void { this.editingRoom = null; this.form = this.emptyForm(); this.newSvc = { name: '', price: 0, duration: 30 }; this.showModal = true; }

  openEdit(room: any): void {
    this.editingRoom = room;
    this.form = { number: room.number || '', name: room.name || '', type: room.type || 'consultation', floor: room.floor || 1, isActive: room.isActive !== false, assignedDoctorIds: [...(room.assignedDoctorIds || [])], services: JSON.parse(JSON.stringify(room.services || [])) };
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
    if (!this.newSvc.name || this.newSvc.price <= 0) { this.toast.error('Введи название и цену услуги'); return; }
    this.form.services.push({ ...this.newSvc });
    this.newSvc = { name: '', price: 0, duration: 30 };
  }

  removeService(i: number): void { this.form.services.splice(i, 1); }

  saveRoom(): void {
    if (!this.form.name || this.isSaving) { if (!this.form.name) this.toast.error('Введи название кабинета'); return; }
    this.isSaving = true;
    const req = this.editingRoom
      ? this.api.put<any>(`/rooms/${this.editingRoom.id}`, this.form)
      : this.api.post<any>('/rooms', this.form);
    req.subscribe({
      next: () => { this.isSaving = false; this.showModal = false; this.toast.success(this.editingRoom ? 'Кабинет обновлён' : 'Кабинет создан'); this.load(); this.cdr.detectChanges(); },
      error: () => { this.isSaving = false; this.toast.error('Ошибка'); this.cdr.detectChanges(); }
    });
  }

  deleteRoom(id: number): void {
    if (!confirm('Удалить кабинет?')) return;
    this.api.delete(`/rooms/${id}`).subscribe({ next: () => { this.toast.success('Кабинет удалён'); this.load(); } });
  }
}
