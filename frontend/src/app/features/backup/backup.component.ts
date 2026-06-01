import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface BackupMeta {
  filename: string;
  size: number;
  sizeMB: string;
  createdAt: string;
}

interface BackupList {
  items: BackupMeta[];
  total: number;
  totalSize: number;
  totalSizeMB: string;
}

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
<div class="backup-page">
  <div class="bg-deco"></div>

  <!-- Header -->
  <header class="backup-header">
    <div>
      <h1><span class="material-icons">backup</span> {{ 'BACKUP.TITLE' | translate }}</h1>
      <p class="subtitle">{{ 'BACKUP.SUBTITLE' | translate }}</p>
    </div>
    <button class="btn-create" (click)="createBackup()" [disabled]="creating">
      <span class="material-icons" [class.spin]="creating">{{ creating ? 'sync' : 'add_circle' }}</span>
      {{ creating ? ('BACKUP.CREATING' | translate) : ('BACKUP.CREATE_NOW' | translate) }}
    </button>
  </header>

  <!-- Stats -->
  <div class="stats-row" *ngIf="backupData">
    <div class="stat-card">
      <span class="material-icons stat-icon">folder</span>
      <div class="stat-val">{{ backupData.total }}</div>
      <div class="stat-lbl">{{ 'BACKUP.TOTAL_BACKUPS' | translate }}</div>
    </div>
    <div class="stat-card">
      <span class="material-icons stat-icon">storage</span>
      <div class="stat-val">{{ backupData.totalSizeMB }} MB</div>
      <div class="stat-lbl">{{ 'BACKUP.TOTAL_SIZE' | translate }}</div>
    </div>
    <div class="stat-card" *ngIf="backupData.items.length > 0">
      <span class="material-icons stat-icon">schedule</span>
      <div class="stat-val">{{ backupData.items[0].createdAt | date:'dd.MM.yy HH:mm' }}</div>
      <div class="stat-lbl">{{ 'BACKUP.LAST_BACKUP' | translate }}</div>
    </div>
    <!-- Storage progress -->
    <div class="stat-card storage-card">
      <div class="storage-header">
        <span class="material-icons stat-icon">pie_chart</span>
        <div class="stat-lbl">Storage (max 1 GB)</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill"
          [style.width]="storagePct + '%'"
          [class.fill-ok]="storagePct < 70"
          [class.fill-warn]="storagePct >= 70 && storagePct < 90"
          [class.fill-err]="storagePct >= 90">
        </div>
      </div>
      <div class="storage-label">{{ backupData.totalSizeMB }} MB / 1024 MB ({{ storagePct }}%)</div>
    </div>
  </div>

  <!-- Success/Error messages -->
  <div class="toast toast-ok" *ngIf="successMsg" (click)="successMsg=''">
    <span class="material-icons">check_circle</span> {{ successMsg }}
  </div>
  <div class="toast toast-err" *ngIf="errorMsg" (click)="errorMsg=''">
    <span class="material-icons">error</span> {{ errorMsg }}
  </div>

  <!-- Backup list -->
  <div class="list-card">
    <div class="list-loading" *ngIf="loading">
      <span class="material-icons spin">sync</span>
    </div>

    <div class="empty-state" *ngIf="!loading && backupData?.items?.length === 0">
      <span class="material-icons">folder_off</span>
      <p>{{ 'BACKUP.NO_BACKUPS' | translate }}</p>
      <p class="hint">{{ 'BACKUP.CREATE_NOW' | translate }} ↑</p>
    </div>

    <div class="backup-items" *ngIf="backupData?.items?.length">
      <div class="backup-card" *ngFor="let b of backupData!.items">
        <div class="backup-info">
          <div class="backup-name">
            <span class="material-icons file-icon">folder_zip</span>
            <span>{{ b.filename }}</span>
          </div>
          <div class="backup-meta">
            <span><span class="material-icons">schedule</span> {{ b.createdAt | date:'dd.MM.yyyy HH:mm:ss' }}</span>
            <span class="separator">·</span>
            <span><span class="material-icons">data_usage</span> {{ b.sizeMB }} MB</span>
          </div>
        </div>
        <div class="backup-actions">
          <button class="btn-action btn-dl" (click)="download(b.filename)" title="{{ 'BACKUP.DOWNLOAD' | translate }}">
            <span class="material-icons">download</span>
            {{ 'BACKUP.DOWNLOAD' | translate }}
          </button>
          <button class="btn-action btn-restore" (click)="openRestoreModal(b.filename)"
                  [disabled]="restoring === b.filename"
                  title="{{ 'BACKUP.RESTORE' | translate }}">
            <span class="material-icons" [class.spin]="restoring === b.filename">
              {{ restoring === b.filename ? 'sync' : 'restore' }}
            </span>
            {{ 'BACKUP.RESTORE' | translate }}
          </button>
          <button class="btn-action btn-del" (click)="confirmDelete(b.filename)"
                  [disabled]="deleting === b.filename"
                  title="{{ 'BACKUP.DELETE' | translate }}">
            <span class="material-icons" [class.spin]="deleting === b.filename">
              {{ deleting === b.filename ? 'sync' : 'delete' }}
            </span>
            {{ 'BACKUP.DELETE' | translate }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ─── Restore Modal ─── -->
  <div class="modal-overlay" *ngIf="showRestoreModal" (click)="closeRestoreModal()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header danger">
        <span class="material-icons">warning</span>
        <h2>{{ 'BACKUP.RESTORE_TITLE' | translate }}</h2>
      </div>
      <div class="modal-body">
        <p class="modal-warning">{{ 'BACKUP.RESTORE_WARNING' | translate }}</p>
        <div class="modal-file">{{ restoreFilename }}</div>
        <p class="modal-confirm-label">{{ 'BACKUP.RESTORE_CONFIRM_TEXT' | translate }}</p>
        <input
          class="confirm-input"
          type="text"
          [(ngModel)]="restoreConfirmation"
          [placeholder]="'BACKUP.RESTORE_PLACEHOLDER' | translate"
          (keydown.enter)="executeRestore()">
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" (click)="closeRestoreModal()">{{ 'BACKUP.CANCEL' | translate }}</button>
        <button class="btn-danger"
          [disabled]="restoreConfirmation !== 'RESTORE' || !!restoring"
          (click)="executeRestore()">
          <span class="material-icons" [class.spin]="!!restoring">{{ restoring ? 'sync' : 'restore' }}</span>
          {{ 'BACKUP.RESTORE_BUTTON' | translate }}
        </button>
      </div>
    </div>
  </div>

  <!-- ─── Delete Confirm Modal ─── -->
  <div class="modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header danger">
        <span class="material-icons">delete_forever</span>
        <h2>{{ 'BACKUP.DELETE_TITLE' | translate }}</h2>
      </div>
      <div class="modal-body">
        <p class="modal-warning">{{ 'BACKUP.DELETE_WARNING' | translate }}</p>
        <div class="modal-file">{{ deleteFilename }}</div>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" (click)="closeDeleteModal()">{{ 'BACKUP.CANCEL' | translate }}</button>
        <button class="btn-danger" [disabled]="!!deleting" (click)="executeDelete()">
          <span class="material-icons" [class.spin]="!!deleting">{{ deleting ? 'sync' : 'delete' }}</span>
          {{ 'BACKUP.DELETE_BUTTON' | translate }}
        </button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .backup-page {
      padding: 24px;
      position: relative;
      min-height: 100vh;
      background: #f8faff;
    }
    .bg-deco {
      position: fixed; top: -200px; right: -200px;
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(26,115,232,0.06) 0%, transparent 70%);
      pointer-events: none;
    }

    /* Header */
    .backup-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 16px; margin-bottom: 24px;
    }
    .backup-header h1 {
      display: flex; align-items: center; gap: 10px;
      font-size: 26px; font-weight: 800; color: #0f2d52; margin: 0 0 4px;
    }
    .backup-header h1 .material-icons { font-size: 30px; color: #1a73e8; }
    .subtitle { font-size: 14px; color: #718096; margin: 0; }

    .btn-create {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 22px; border-radius: 14px;
      background: #1a73e8; color: white; border: none;
      font-size: 15px; font-weight: 700; cursor: pointer;
      transition: all 0.2s; box-shadow: 0 4px 12px rgba(26,115,232,0.3);
    }
    .btn-create:hover:not(:disabled) { background: #1558c0; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(26,115,232,0.4); }
    .btn-create:disabled { opacity: 0.65; cursor: not-allowed; box-shadow: none; }
    .btn-create .material-icons { font-size: 20px; }

    /* Stats */
    .stats-row {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px; margin-bottom: 20px;
    }
    .stat-card {
      background: white; border-radius: 16px; padding: 20px;
      border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: transform 0.2s, box-shadow 0.2s;
      animation: fadeUp 0.35s ease both;
    }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
    .storage-card { grid-column: span 1; }
    .storage-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .stat-icon { font-size: 26px; color: #1a73e8; margin-bottom: 6px; display: block; }
    .stat-val { font-size: 26px; font-weight: 800; color: #0f2d52; line-height: 1.1; }
    .stat-lbl { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

    .progress-bar { height: 10px; background: #f0f4f8; border-radius: 99px; overflow: hidden; margin-bottom: 6px; }
    .progress-fill { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
    .fill-ok   { background: linear-gradient(90deg, #10b981, #34d399); }
    .fill-warn { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .fill-err  { background: linear-gradient(90deg, #ef4444, #f87171); }
    .storage-label { font-size: 11px; color: #94a3b8; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Toasts */
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-radius: 12px; margin-bottom: 16px;
      font-size: 14px; font-weight: 500; cursor: pointer;
      animation: fadeUp 0.3s ease;
    }
    .toast .material-icons { font-size: 20px; }
    .toast-ok  { background: #e8f5e9; color: #059669; border: 1px solid rgba(16,185,129,0.2); }
    .toast-err { background: #fce8e6; color: #dc2626; border: 1px solid rgba(239,68,68,0.2); }

    /* List card */
    .list-card {
      background: white; border-radius: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.06);
      overflow: hidden; position: relative; min-height: 120px;
    }
    .list-loading {
      position: absolute; inset: 0;
      background: rgba(255,255,255,0.8);
      display: flex; align-items: center; justify-content: center; z-index: 5;
    }

    .empty-state {
      text-align: center; padding: 60px 24px; color: #a0aec0;
    }
    .empty-state .material-icons { font-size: 52px; color: #cbd5e0; display: block; margin-bottom: 12px; }
    .empty-state p { font-size: 15px; margin: 4px 0; }
    .empty-state .hint { font-size: 13px; color: #cbd5e0; }

    .backup-items { display: flex; flex-direction: column; }
    .backup-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; gap: 16px; flex-wrap: wrap;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;
    }
    .backup-card:last-child { border-bottom: none; }
    .backup-card:hover { background: #f8faff; }

    .backup-info { flex: 1; min-width: 0; }
    .backup-name {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; font-weight: 600; color: #0f2d52; margin-bottom: 6px;
    }
    .file-icon { font-size: 20px; color: #1a73e8; }
    .backup-meta {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #94a3b8;
    }
    .backup-meta .material-icons { font-size: 14px; vertical-align: middle; }
    .separator { color: #e2e8f0; }

    .backup-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-action {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 12px; border-radius: 10px; border: 1px solid;
      font-size: 12px; font-weight: 600; cursor: pointer;
      transition: all 0.18s; white-space: nowrap;
    }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-action .material-icons { font-size: 16px; }

    .btn-dl {
      border-color: rgba(26,115,232,0.25); color: #1a73e8; background: rgba(26,115,232,0.06);
    }
    .btn-dl:hover:not(:disabled) { background: #1a73e8; color: white; }

    .btn-restore {
      border-color: rgba(245,158,11,0.25); color: #d97706; background: rgba(245,158,11,0.06);
    }
    .btn-restore:hover:not(:disabled) { background: #f59e0b; color: white; }

    .btn-del {
      border-color: rgba(239,68,68,0.25); color: #dc2626; background: rgba(239,68,68,0.06);
    }
    .btn-del:hover:not(:disabled) { background: #ef4444; color: white; }

    /* Animations */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; display: inline-block; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 16px;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      background: white; border-radius: 20px; width: 100%; max-width: 460px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      animation: slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .modal-header {
      padding: 20px 24px 16px; display: flex; align-items: center; gap: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .modal-header.danger { border-top: 4px solid #ef4444; border-radius: 20px 20px 0 0; }
    .modal-header.danger .material-icons { font-size: 28px; color: #ef4444; }
    .modal-header h2 { font-size: 18px; font-weight: 700; color: #0f2d52; margin: 0; }

    .modal-body { padding: 20px 24px; }
    .modal-warning {
      font-size: 14px; color: #64748b; margin: 0 0 12px;
      background: rgba(239,68,68,0.05); border-radius: 10px;
      padding: 10px 14px; border-left: 3px solid #ef4444;
    }
    .modal-file {
      font-family: monospace; font-size: 13px;
      background: #f8faff; border: 1px solid #e2e8f0;
      border-radius: 8px; padding: 10px 12px;
      color: #334155; margin-bottom: 14px;
      word-break: break-all;
    }
    .modal-confirm-label { font-size: 13px; color: #334155; margin: 0 0 8px; font-weight: 600; }
    .confirm-input {
      width: 100%; padding: 10px 12px; border-radius: 10px;
      border: 2px solid #e2e8f0; font-size: 14px; outline: none;
      transition: border-color 0.2s; box-sizing: border-box;
      font-family: monospace; letter-spacing: 1px;
    }
    .confirm-input:focus { border-color: #ef4444; }

    .modal-footer {
      padding: 16px 24px 20px; display: flex; justify-content: flex-end;
      gap: 10px; border-top: 1px solid #f1f5f9;
    }
    .btn-cancel {
      padding: 10px 18px; border-radius: 10px; border: 1px solid #e2e8f0;
      background: white; color: #64748b; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-cancel:hover { background: #f8faff; }
    .btn-danger {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 18px; border-radius: 10px; border: none;
      background: #ef4444; color: white; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-danger:hover:not(:disabled) { background: #dc2626; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-danger .material-icons { font-size: 18px; }

    /* Mobile */
    @media (max-width: 768px) {
      .backup-page { padding: 16px; }
      .backup-header { flex-direction: column; }
      .stats-row { grid-template-columns: 1fr 1fr; }
      .backup-card { flex-direction: column; align-items: flex-start; }
      .backup-actions { width: 100%; }
      .btn-action { flex: 1; justify-content: center; }
    }
    @media (max-width: 480px) {
      .stats-row { grid-template-columns: 1fr; }
    }
  `]
})
export class BackupComponent implements OnInit, OnDestroy {
  backupData: BackupList | null = null;
  loading = false;
  creating = false;
  restoring = '';
  deleting = '';
  successMsg = '';
  errorMsg = '';

  // Restore modal
  showRestoreModal = false;
  restoreFilename = '';
  restoreConfirmation = '';

  // Delete modal
  showDeleteModal = false;
  deleteFilename = '';

  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadList();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get storagePct(): number {
    if (!this.backupData) return 0;
    const max = 1024 * 1024 * 1024;
    return Math.min(100, Math.round((this.backupData.totalSize / max) * 100));
  }

  loadList(): void {
    this.loading = true;
    this.api.get<any>('/backup').pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.backupData = res?.data ?? res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  createBackup(): void {
    this.creating = true;
    this.clearMessages();
    this.api.post<any>('/backup/create', {}).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const d = res?.data ?? res;
        this.successMsg = `✓ ${d?.filename} (${d?.sizeMB} MB)`;
        this.creating = false;
        this.loadList();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMsg = err?.error?.error?.message || 'Eroare la creare backup';
        this.creating = false;
        this.cdr.markForCheck();
      }
    });
  }

  download(filename: string): void {
    const token = localStorage.getItem('token') || '';
    fetch(`/api/backup/download/${encodeURIComponent(filename)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error('Download failed');
        return r.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => {
        this.errorMsg = 'Download failed';
        this.cdr.markForCheck();
      });
  }

  // ─── Restore ───────────────────────────────────────────────────────────────

  openRestoreModal(filename: string): void {
    this.restoreFilename = filename;
    this.restoreConfirmation = '';
    this.showRestoreModal = true;
  }

  closeRestoreModal(): void {
    this.showRestoreModal = false;
    this.restoreFilename = '';
    this.restoreConfirmation = '';
  }

  executeRestore(): void {
    if (this.restoreConfirmation !== 'RESTORE') return;
    this.restoring = this.restoreFilename;
    this.clearMessages();

    this.api.post<any>(`/backup/restore/${encodeURIComponent(this.restoreFilename)}`, {
      confirmation: 'RESTORE'
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.successMsg = 'BACKUP.SUCCESS_RESTORED';
        this.restoring = '';
        this.closeRestoreModal();
        this.loadList();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMsg = err?.error?.error?.message || 'Eroare la restaurare';
        this.restoring = '';
        this.closeRestoreModal();
        this.cdr.markForCheck();
      }
    });
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  confirmDelete(filename: string): void {
    this.deleteFilename = filename;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteFilename = '';
  }

  executeDelete(): void {
    this.deleting = this.deleteFilename;
    this.clearMessages();

    this.api.delete<any>(`/backup/${encodeURIComponent(this.deleteFilename)}`)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.successMsg = 'BACKUP.SUCCESS_DELETED';
          this.deleting = '';
          this.closeDeleteModal();
          this.loadList();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMsg = err?.error?.error?.message || 'Eroare la ștergere';
          this.deleting = '';
          this.closeDeleteModal();
          this.cdr.markForCheck();
        }
      });
  }

  private clearMessages(): void {
    this.successMsg = '';
    this.errorMsg = '';
  }
}
