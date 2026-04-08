import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="custom-date-picker">
      <select [(ngModel)]="selectedDay" (ngModelChange)="emitDate()" class="date-select">
        <option value="">{{ 'DATE.DAY' | translate }}</option>
        <option *ngFor="let d of days" [value]="d">{{ d }}</option>
      </select>
      <select [(ngModel)]="selectedMonth" (ngModelChange)="onMonthChange()" class="date-select">
        <option value="">{{ 'DATE.MONTH' | translate }}</option>
        <option *ngFor="let m of months; let i = index" [value]="i + 1">{{ m }}</option>
      </select>
      <select [(ngModel)]="selectedYear" (ngModelChange)="emitDate()" class="date-select">
        <option value="">{{ 'DATE.YEAR' | translate }}</option>
        <option *ngFor="let y of years" [value]="y">{{ y }}</option>
      </select>
    </div>
  `,
  styles: [`
    .custom-date-picker {
      display: flex;
      gap: 8px;
      width: 100%;
    }
    .date-select {
      flex: 1;
      height: 42px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 0 8px;
      font-size: 14px;
      font-family: inherit;
      background: white;
      cursor: pointer;
      outline: none;
      color: #2d3748;
    }
    .date-select:focus {
      border-color: #1a73e8;
      box-shadow: 0 0 0 3px rgba(26,115,232,0.1);
    }
    :host-context(body.dark-theme) .date-select {
      background: #1e293b;
      border-color: #334155;
      color: #e2e8f0;
    }
  `]
})
export class DatePickerComponent implements OnInit, OnChanges {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  selectedDay: number | string = '';
  selectedMonth: number | string = '';
  selectedYear: number | string = '';

  days: number[] = [];
  months: string[] = [];
  years: number[] = [];

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.buildYears();
    this.buildMonths();
    this.buildDays();
    if (this.value) this.parseValue();
    this.translate.onLangChange.subscribe(() => this.buildMonths());
  }

  ngOnChanges(): void {
    if (this.value) this.parseValue();
  }

  buildYears(): void {
    const current = new Date().getFullYear();
    this.years = Array.from({ length: 111 }, (_, i) => current + 10 - i);
  }

  buildMonths(): void {
    const lang = this.translate.currentLang || 'ru';
    const monthsRo = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
    const monthsRu = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    if (lang === 'ro') this.months = monthsRo;
    else if (lang === 'en') this.months = monthsEn;
    else this.months = monthsRu;
  }

  buildDays(): void {
    this.days = Array.from({ length: 31 }, (_, i) => i + 1);
  }

  onMonthChange(): void {
    this.buildDays();
    this.emitDate();
  }

  parseValue(): void {
    if (!this.value) return;
    const parts = this.value.split('-');
    if (parts.length === 3) {
      this.selectedYear = parseInt(parts[0]);
      this.selectedMonth = parseInt(parts[1]);
      this.selectedDay = parseInt(parts[2]);
    }
  }

  emitDate(): void {
    if (this.selectedYear && this.selectedMonth && this.selectedDay) {
      const y = String(this.selectedYear).padStart(4, '0');
      const m = String(this.selectedMonth).padStart(2, '0');
      const d = String(this.selectedDay).padStart(2, '0');
      this.valueChange.emit(`${y}-${m}-${d}`);
    } else {
      this.valueChange.emit('');
    }
  }
}
