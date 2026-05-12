import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

const CATEGORIES = [
  { value: 'all',           labelKey: 'LIS.CATALOG.CATEGORIES.ALL',          icon: 'apps' },
  { value: 'hematology',   labelKey: 'LIS.CATALOG.CATEGORIES.HEMATOLOGY',    icon: 'opacity' },
  { value: 'biochemistry', labelKey: 'LIS.CATALOG.CATEGORIES.BIOCHEMISTRY',  icon: 'science' },
  { value: 'urine',        labelKey: 'LIS.CATALOG.CATEGORIES.URINE',         icon: 'water_drop' },
  { value: 'hormones',     labelKey: 'LIS.CATALOG.CATEGORIES.HORMONES',      icon: 'biotech' },
  { value: 'immunology',   labelKey: 'LIS.CATALOG.CATEGORIES.IMMUNOLOGY',    icon: 'shield' },
  { value: 'microbiology', labelKey: 'LIS.CATALOG.CATEGORIES.MICROBIOLOGY',  icon: 'bug_report' },
  { value: 'coagulation',  labelKey: 'LIS.CATALOG.CATEGORIES.COAGULATION',   icon: 'bloodtype' },
  { value: 'cardiac',      labelKey: 'LIS.CATALOG.CATEGORIES.CARDIAC',       icon: 'favorite' },
];

@Component({
  selector: 'app-lab-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title"><span class="material-icons">biotech</span> {{ 'LIS.CATALOG.TITLE' | translate }}</h1>
          <p class="page-sub">{{ tests.length }} {{ 'LIS.CATALOG.TESTS_COUNT' | translate }}</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <span class="material-icons">add</span> {{ 'LIS.CATALOG.ADD_TEST' | translate }}
        </button>
      </div>

      <div class="search-bar">
        <span class="material-icons">search</span>
        <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" [placeholder]="'LIS.CATALOG.SEARCH' | translate">
      </div>

      <div class="cat-tabs">
        <button class="cat-tab" *ngFor="let c of categories"
          [class.active]="selectedCategory === c.value"
          (click)="selectCategory(c.value)">
          <span class="material-icons">{{ c.icon }}</span>
          {{ c.labelKey | translate }}
        </button>
      </div>

      <div class="loading" *ngIf="isLoading">
        <span class="material-icons spin">autorenew</span> {{ 'COMMON.LOADING' | translate }}
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
              <span class="material-icons">analytics</span> {{ t.parameters.length }}
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
        <p>{{ 'LIS.CATALOG.EMPTY' | translate }}</p>
      </div>

      <!-- Modal -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="showModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ (editingTest ? 'LIS.CATALOG.EDIT_TEST' : 'LIS.CATALOG.NEW_TEST') | translate }}</h2>
            <button class="btn-close" (click)="showModal = false"><span class="material-icons">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'LIS.CATALOG.TEST_NAME' | translate }}</label>
                <input type="text" [(ngModel)]="newTest.name" [placeholder]="'LIS.CATALOG.TEST_NAME' | translate">
              </div>
              <div class="form-group">
                <label>{{ 'LIS.CATALOG.CODE' | translate }}</label>
                <input type="text" [(ngModel)]="newTest.code" placeholder="GLU">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'LIS.CATALOG.CATEGORY' | translate }}</label>
                <select [(ngModel)]="newTest.category">
                  <option *ngFor="let c of categories" [value]="c.value" [disabled]="c.value === 'all'">{{ c.labelKey | translate }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ 'LIS.CATALOG.PRICE' | translate }}</label>
                <input type="number" [(ngModel)]="newTest.price">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'LIS.CATALOG.TURNAROUND' | translate }}</label>
                <input type="number" [(ngModel)]="newTest.turnaroundTime">
              </div>
              <div class="form-group">
                <label>{{ 'LIS.CATALOG.SAMPLE_TYPE' | translate }}</label>
                <select [(ngModel)]="newTest.sampleType">
                  <option value="blood">{{ 'LIS.CATALOG.SAMPLE_TYPES.BLOOD' | translate }}</option>
                  <option value="urine">{{ 'LIS.CATALOG.SAMPLE_TYPES.URINE' | translate }}</option>
                  <option value="stool">{{ 'LIS.CATALOG.SAMPLE_TYPES.STOOL' | translate }}</option>
                  <option value="saliva">{{ 'LIS.CATALOG.SAMPLE_TYPES.SALIVA' | translate }}</option>
                  <option value="other">{{ 'LIS.CATALOG.SAMPLE_TYPES.OTHER' | translate }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'LIS.CATALOG.DESCRIPTION' | translate }}</label>
              <textarea [(ngModel)]="newTest.description" rows="2"></textarea>
            </div>
            <div class="params-block">
              <div class="params-header">
                <span class="params-label">{{ 'LIS.CATALOG.PARAMETERS' | translate }}</span>
                <button class="btn-mini" (click)="addParameter()">
                  <span class="material-icons">add</span> {{ 'LIS.CATALOG.ADD_PARAMETER' | translate }}
                </button>
              </div>
              <div class="params-hint" *ngIf="newTest.parameters?.length">
                <span class="material-icons">info</span>
                <span>{{ 'LIS.CATALOG.HINT_NORMS' | translate }}</span>
              </div>
              <div class="params-list">
                <div class="param-row" *ngFor="let p of newTest.parameters; let i = index">
                  <input type="text" [(ngModel)]="p.name" [placeholder]="'LIS.CATALOG.PARAM_NAME' | translate">
                  <input type="text" [(ngModel)]="p.unit" [placeholder]="'LIS.CATALOG.PARAM_UNIT' | translate">
                  <input type="number" [(ngModel)]="p.refMin" [placeholder]="'LIS.CATALOG.REF_MIN' | translate">
                  <input type="number" [(ngModel)]="p.refMax" [placeholder]="'LIS.CATALOG.REF_MAX' | translate">
                  <button class="btn-icon-sm danger" (click)="removeParameter(i)">
                    <span class="material-icons">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showModal = false">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="btn-save" (click)="saveTest()">
              <span class="material-icons">check</span>
              {{ (editingTest ? 'COMMON.SAVE' : 'COMMON.CREATE') | translate }}
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
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
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
    if (!this.newTest.name || !this.newTest.code) {
      this.toast.error(this.translate.instant('COMMON.REQUIRED'));
      return;
    }
    const url = this.editingTest ? `/lab/tests/${this.editingTest.id}` : '/lab/tests';
    const req = this.editingTest ? this.api.patch<any>(url, this.newTest) : this.api.post<any>(url, this.newTest);
    req.subscribe({
      next: () => {
        this.toast.success(this.translate.instant(this.editingTest ? 'LIS.CATALOG.TEST_UPDATED' : 'LIS.CATALOG.TEST_CREATED'));
        this.showModal = false;
        this.loadTests();
      },
      error: () => this.toast.error(this.translate.instant('COMMON.ERROR'))
    });
  }

  deleteTest(id: number): void {
    if (!confirm(this.translate.instant('LIS.CATALOG.DELETE_CONFIRM'))) return;
    this.api.delete(`/lab/tests/${id}`).subscribe({
      next: () => { this.toast.success(this.translate.instant('LIS.CATALOG.TEST_DELETED')); this.loadTests(); }
    });
  }

  getCategoryIcon(cat: string): string { return CATEGORIES.find(c => c.value === cat)?.icon || 'science'; }
}
