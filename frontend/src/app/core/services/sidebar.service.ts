import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private _isOpen = new BehaviorSubject<boolean>(false);
  private _isCollapsed = new BehaviorSubject<boolean>(false);

  isOpen$ = this._isOpen.asObservable();
  isCollapsed$ = this._isCollapsed.asObservable();

  toggle(): void { this._isOpen.next(!this._isOpen.value); }
  close(): void  { this._isOpen.next(false); }

  setCollapsed(val: boolean): void { this._isCollapsed.next(val); }
  get isCollapsed(): boolean { return this._isCollapsed.value; }
}
