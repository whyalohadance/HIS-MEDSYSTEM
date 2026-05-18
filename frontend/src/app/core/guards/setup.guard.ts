import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export const setupGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const http = inject(HttpClient);

  try {
    const response: any = await firstValueFrom(
      http.get('/api/setup/status')
    );

    const isSetupComplete = response?.data?.isSetupComplete;

    if (!isSetupComplete && state.url !== '/setup') {
      router.navigate(['/setup']);
      return false;
    }

    if (isSetupComplete && state.url === '/setup') {
      router.navigate(['/auth/login']);
      return false;
    }

    return true;
  } catch {
    return true;
  }
};
