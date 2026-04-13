import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as string[];
  const userRole = auth.currentUser?.role;

  if (allowedRoles && userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  router.navigate(['/access-denied']);
  return false;
};
