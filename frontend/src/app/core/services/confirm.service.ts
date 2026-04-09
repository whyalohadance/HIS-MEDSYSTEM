import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private options$ = new BehaviorSubject<ConfirmOptions | null>(null);
  options = this.options$.asObservable();
  private resolver!: (value: boolean) => void;

  async confirm(options: ConfirmOptions): Promise<boolean> {
    this.options$.next(options);
    return new Promise(resolve => { this.resolver = resolve; });
  }

  resolve(value: boolean): void {
    this.options$.next(null);
    if (this.resolver) this.resolver(value);
  }
}
