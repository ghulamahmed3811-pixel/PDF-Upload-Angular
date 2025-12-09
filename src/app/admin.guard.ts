import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AdminService } from './admin.service';

export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const adminService = inject(AdminService);
  const router = inject(Router);

  // If accessing /admin route, set admin status and redirect to home
  if (state.url === '/admin' || state.url.startsWith('/admin')) {
    console.log('Admin guard: Detected /admin route, setting admin status');
    adminService.setAdminStatus('admin');
    console.log('Admin guard: Redirecting to home');
    // Navigate immediately - the false return will prevent loading /admin component
    router.navigate(['/'], { replaceUrl: true });
    return false; // Prevent navigation to /admin, redirect instead
  }

  return true; // Allow navigation for other routes
};

