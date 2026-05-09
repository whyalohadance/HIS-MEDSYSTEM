import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

const CATEGORIES = [
  { value: 'all',           label: 'Все',              icon: 'apps' },
  { value: 'hematology',   label: 'Гематология',       icon: 'opacity' },
  { value: 'biochemistry', label: 'Биохимия',          icon: 'science' },
  { value: 'urine',        label: 'Анализ мочи',       icon: 'water_drop' },
  { value: 'hormones',     label: 'Гормоны',           icon: 'biotech' },
  { value: 'immunology',   label: 'Иммунология',       icon: 'shield' },
  { value: 'microbiology', label: 'Микробиология',     icon: 'bug_report' },
  { value: 'coagulation',  label: 'Коагуляция',        icon: 'bloodtype' },
  { value: 'cardiac',      label: 'Кардиомаркеры',     icon: 'favorite' },
];

@Component({
  selector: 'app-lab-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title"><span class="material-icons">biotech</span> Каталог тестов</h1>
          <p class="page-sub">{{ tests.length }} тестов</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <span class="material-icons">add</span> Добавить тест
        </button>
      </div>

      <div class="search-bar">
        <span class="material-icons">search</span>
        <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" placeholder="Поиск по названию или коду...">
      </div>

      <div class="cat-tabs">
        <button class="cat-tab" *ngFor="let c of categories"
          [class.active]="selectedCategory === c.value"
          (click)="selectCategory(c.value)">
          <span class="material-icons">{{ c.icon }}</span>
          {{ c.label }}
        </button>
      </div>

      <div class="loading" *ngIf="isLoading">
        <span class="material-icons spin">autorenew</span> Загрузка...
      </div>

      <div class="tests-grid" *ngIf="!isLoading && filtered.length > 0">
        <div class="test-card" *ngFor="let t of filtered">
          <div class="test-header">
            <span class="test-icon" [class]="'cat-' + t.category">
              <span class="material-icons">{{ getCategoryIcon(t.category) }}</span>
            </span>
            <div class="test-info">
              <div class="test-name">{{ t.name }}</div>
              <div class="test-code">{{ t.code }}</div>
            </div>
          </div>
          <div class="test-meta">
            <span class="meta-item"><span class="material-icons">payments</span> {{ t.price }} MDL</span>
            <span class="meta-item"><span class="material-icons">schedule</span> {{ t.turnaroundTime }}ч</span>
            <span class="meta-item" *ngIf="t.parameters?.length">
              <span class="material-icons">analytics</span> {{ t.parameters.length }} парам.
            </span>
          </div>
          <div class="test-actions">
            <button class="btn-icon" (click)="openEdit(t)"><span class="material-icons">edit</span></button>
            <button class="btn-icon danger" (click)="deleteTest(t.id)"><span class="material-icons">delete</span></button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!isLoading && filtered.length === 0">
        <span class="material-icons">science</span>
        <p>Тестов не найдено</p>
      </div>

      <!-- Modal -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="showModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingTest ? 'Редактировать тест' : 'Новый тест' }}</h2>
            <button class="btn-close" (click)="showModal = false"><span class="material-icons">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Название</label>
                <input type="text" [(ngModel)]="newTest.name" placeholder="Глюкоза">
              </div>
              <div class="form-group">
                <label>Код</label>
                <input type="text" [(ngModel)]="newTest.code" placeholder="GLU">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Категория</label>
                <select [(ngModel)]="newTest.category">
                  <option *ngFor="let c of categories" [value]="c.value" [disabled]="c.value === 'all'">{{ c.label }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Цена (MDL)</label>
                <input type="number" [(ngModel)]="newTest.price">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Срок выполнения (ч)</label>
                <input type="number" [(ngModel)]="newTest.turnaroundTime">
              </div>
              <div class="form-group">
                <label>Тип образца</label>
                <select [(ngModel)]="newTest.sampleType">
                  <option value="blood">Кровь</option>
                  <option value="urine">Моча</option>
                  <option value="stool">Кал</option>
                  <option value="saliva">Слюна</option>
                  <option value="other">Другое</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Описание</label>
              <textarea [(ngModel)]="newTest.description" rows="2"></textarea>
            </div>
            <div class="params-block">
              <div class="params-header">
                <span class="params-label">Параметры теста</span>
                <button class="btn-mini" (click)="addParameter()">
                  <span class="material-icons">add</span> Параметр
                </button>
              </div>
              <div class="params-hint" *ngIf="newTest.parameters?.length">
                <span class="material-icons">info</span>
                <span>Мин/Макс — референсные значения (нормы). Результат вне диапазона будет автоматически отмечен как ↑ высокий или ↓ низкий.</span>
              </div>
              <div class="params-list">
                <div class="param-row" *ngFor="let p of newTest.parameters; let i = index">
                  <input type="text" [(ngModel)]="p.name" placeholder="Название">
                  <input type="text" [(ngModel)]="p.unit" placeholder="Ед.">
                  <input type="number" [(ngModel)]="p.refMin" placeholder="Мин">
                  <input type="number" [(ngModel)]="p.refMax" placeholder="Макс">
                  <button class="btn-icon-sm danger" (click)="removeParameter(i)">
                    <span class="material-icons">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showModal = false">Отмена</button>
            <button class="btn-save" (click)="saveTest()">
              <span class="material-icons">check</span>
              {{ editingTest ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { display: flex; align-items: center; gap: 8px; font-size: 24px; font-weight: 700; color: #0f2d52; margin: 0; }
    .page-title .material-icons { color: #10b981; font-size: 28px; }
    .page-sub { font-size: 14px; color: #718096; margin: 4px 0 0; }
    .btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 18px; background: linear-gradient(135deg,#10b981,#059669); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: inherit; font-size: 14px; }
    .search-bar { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; margin-bottom: 14px; }
    .search-bar .material-icons { color: #94a3b8; }
    .search-bar input { flex: 1; border: none; outline: none; font-family: inherit; font-size: 14px; }
    .cat-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 20px; }
    .cat-tab { display: flex; align-items: center; gap: 5px; padding: 7px 14px; background: white; border: 1.5px solid #e2e8f0; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; font-family: inherit; color: #64748b; }
    .cat-tab.active { background: #d1fae5; border-color: #10b981; color: #047857; }
    .cat-tab .material-icons { font-size: 15px; }
    .loading { display: flex; align-items: center; gap: 8px; color: #718096; padding: 40px; justify-content: center; }
    .loading .material-icons { animation: spin 1s linear infinite; }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .empty-state { text-align: center; padding: 60px; color: #a0aec0; }
    .empty-state .material-icons { font-size: 48px; display: block; margin-bottom: 12px; }
    .tests-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 14px; }
    .test-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: all 0.15s; }
    .test-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
    .test-header { display: flex; align-items: center; gap: 10px; }
    .test-icon { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: #ccfbf1; color: #0d9488; flex-shrink: 0; }
    .test-icon.cat-hematology { background: #fee2e2; color: #dc2626; }
    .test-icon.cat-biochemistry { background: #dbeafe; color: #1e40af; }
    .test-icon.cat-urine { background: #fef3c7; color: #d97706; }
    .test-icon.cat-hormones { background: #ede9fe; color: #6d28d9; }
    .test-icon.cat-cardiac { background: #fce7f3; color: #be185d; }
    .test-icon .material-icons { font-size: 18px; }
    .test-info { flex: 1; min-width: 0; }
    .test-name { font-size: 13px; font-weight: 600; color: #0f2d52; }
    .test-code { font-size: 11px; color: #94a3b8; font-family: ui-monospace; margin-top: 2px; }
    .test-meta { display: flex; gap: 10px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid #f1f5f9; }
    .meta-item { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #64748b; font-weight: 500; }
    .meta-item .material-icons { font-size: 13px; color: #94a3b8; }
    .test-actions { display: flex; gap: 6px; justify-content: flex-end; }
    .btn-icon { background: #f1f5f9; border: none; border-radius: 8px; padding: 6px; cursor: pointer; color: #64748b; display: flex; align-items: center; }
    .btn-icon:hover { background: #e2e8f0; }
    .btn-icon.danger { color: #ef4444; }
    .btn-icon.danger:hover { background: #fee2e2; }
    .btn-icon .material-icons { font-size: 16px; }
    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(3px); }
    .modal-content { background: white; border-radius: 16px; max-width: 660px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
    .modal-header { padding: 18px 22px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 18px; color: #0f2d52; }
    .btn-close { background: transparent; border: none; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; }
    .btn-close:hover { background: #f1f5f9; }
    .modal-body { padding: 22px; overflow-y: auto; flex: 1; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
    .form-group label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; }
    .form-group input, .form-group select, .form-group textarea { padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 13px; font-family: inherit; outline: none; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #10b981; }
    .params-block { border-top: 1px solid #f1f5f9; padding-top: 14px; margin-top: 4px; }
    .params-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .params-label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; }
    .btn-mini { display: flex; align-items: center; gap: 4px; padding: 4px 10px; background: #d1fae5; color: #047857; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .btn-mini .material-icons { font-size: 14px; }
    .params-hint { display: flex; align-items: flex-start; gap: 8px; padding: 8px 12px; background: #f0fdf4; border-left: 3px solid #10b981; border-radius: 6px; font-size: 12px; color: #047857; margin-bottom: 8px; }
    .params-hint .material-icons { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
    .params-list { display: flex; flex-direction: column; gap: 6px; }
    .param-row { display: grid; grid-template-columns: 2fr 70px 65px 65px 32px; gap: 6px; align-items: center; }
    .param-row input { padding: 6px 8px !important; font-size: 12px !important; border-radius: 6px !important; margin-bottom: 0 !important; }
    .btn-icon-sm { background: transparent; border: none; cursor: pointer; padding: 3px; display: flex; align-items: center; }
    .btn-icon-sm.danger { color: #ef4444; }
    .btn-icon-sm .material-icons { font-size: 15px; }
    .modal-footer { padding: 16px 22px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }
    .btn-cancel { padding: 10px 18px; background: #f1f5f9; color: #64748b; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-save { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: linear-gradient(135deg,#10b981,#059669); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: inherit; }
  `]
})
export class LabCatalogComponent implements OnInit {
  tests: any[] = [];
  filtered: any[] = [];
  searchTerm = '';
  selectedCategory = 'all';
  isLoading = false;
  showModal = false;
  editingTest: any = null;
  newTest: any = this.emptyTest();

  readonly categories = CATEGORIES;

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadTests(); }

  emptyTest() {
    return { name: '', code: '', category: 'biochemistry', price: 100, turnaroundTime: 24, sampleType: 'blood', description: '', parameters: [], isActive: true };
  }

  loadTests(): void {
    this.isLoading = true;
    this.api.get<any>('/lab/tests').subscribe({
      next: res => { this.tests = res.data || []; this.applyFilters(); this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilters(): void {
    this.filtered = this.tests.filter(t => {
      if (this.selectedCategory !== 'all' && t.category !== this.selectedCategory) return false;
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        return t.name?.toLowerCase().includes(term) || t.code?.toLowerCase().includes(term);
      }
      return true;
    });
    this.cdr.detectChanges();
  }

  selectCategory(cat: string): void { this.selectedCategory = cat; this.applyFilters(); }

  openCreate(): void { this.editingTest = null; this.newTest = this.emptyTest(); this.showModal = true; }

  openEdit(test: any): void { this.editingTest = test; this.newTest = { ...test, parameters: JSON.parse(JSON.stringify(test.parameters || [])) }; this.showModal = true; }

  addParameter(): void { this.newTest.parameters.push({ name: '', unit: '', refMin: 0, refMax: 100 }); }

  removeParameter(i: number): void { this.newTest.parameters.splice(i, 1); }

  saveTest(): void {
    if (!this.newTest.name || !this.newTest.code) { this.toast.error('Заполни название и код'); return; }
    const url = this.editingTest ? `/lab/tests/${this.editingTest.id}` : '/lab/tests';
    const req = this.editingTest ? this.api.patch<any>(url, this.newTest) : this.api.post<any>(url, this.newTest);
    req.subscribe({
      next: () => { this.toast.success(this.editingTest ? 'Тест обновлён' : 'Тест создан'); this.showModal = false; this.loadTests(); },
      error: () => this.toast.error('Ошибка')
    });
  }

  deleteTest(id: number): void {
    if (!confirm('Удалить тест?')) return;
    this.api.delete(`/lab/tests/${id}`).subscribe({ next: () => { this.toast.success('Удалён'); this.loadTests(); } });
  }

  getCategoryIcon(cat: string): string { return CATEGORIES.find(c => c.value === cat)?.icon || 'science'; }
}
