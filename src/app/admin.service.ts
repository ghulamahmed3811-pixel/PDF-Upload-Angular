import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly ADMIN_KEY = 'admin';
  private readonly STORAGE_KEY = 'isAdmin';
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  public isAdmin$: Observable<boolean> = this.isAdminSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    // Don't auto-load admin status from sessionStorage on initialization
    // Admin status should only be set when explicitly visiting /admin route
    // This ensures that visiting / directly won't show admin buttons
    this.isAdminSubject.next(false);
  }

  /**
   * Check if the provided key matches the admin key
   */
  checkAdminKey(key: string): boolean {
    return key === this.ADMIN_KEY;
  }

  /**
   * Set admin status based on key validation
   * This should only be called when visiting /admin route
   */
  setAdminStatus(key: string): boolean {
    const isAdmin = this.checkAdminKey(key);
    console.log('AdminService: Setting admin status to', isAdmin, 'for key:', key);
    this.isAdminSubject.next(isAdmin);
    
    if (isPlatformBrowser(this.platformId)) {
      if (isAdmin) {
        sessionStorage.setItem(this.STORAGE_KEY, 'true');
        console.log('AdminService: Admin status saved to sessionStorage');
      } else {
        sessionStorage.removeItem(this.STORAGE_KEY);
        console.log('AdminService: Admin status removed from sessionStorage');
      }
    }
    
    return isAdmin;
  }

  /**
   * Check sessionStorage for admin status (only call this when needed, not on init)
   */
  checkSessionStorage(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const storedAdminStatus = sessionStorage.getItem(this.STORAGE_KEY);
      if (storedAdminStatus === 'true') {
        this.isAdminSubject.next(true);
        return true;
      }
    }
    return false;
  }

  /**
   * Get current admin status
   */
  getIsAdmin(): boolean {
    return this.isAdminSubject.value;
  }

  /**
   * Clear admin status (logout)
   */
  clearAdminStatus(): void {
    this.isAdminSubject.next(false);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

