import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Admin guard for protecting admin-only routes
 * Follows Angular best practices: functional guards, reactive programming
 * Single Responsibility: controls route access based on admin role
 * 
 * IMPORTANT: This is for UI/UX only - real security must be enforced on the backend
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate, CanActivateChild {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Check if route can be activated based on admin role
   * @param route - Activated route snapshot
   * @param state - Router state snapshot
   * @returns Observable<boolean> indicating if route can be activated
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAdminAccess(state.url);
  }

  /**
   * Check if child routes can be activated
   * @param childRoute - Child route snapshot
   * @param state - Router state snapshot
   * @returns Observable<boolean> indicating if child route can be activated
   */
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(childRoute, state);
  }

  /**
   * Check admin access and redirect if necessary
   * @param url - Attempted URL
   * @returns Observable<boolean> indicating admin access status
   */
  private checkAdminAccess(url: string): Observable<boolean> {
    // First ensure user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.redirectToLogin(url);
      return new Observable(subscriber => subscriber.next(false));
    }

    // Check admin role using reactive state
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.redirectToLogin(url);
          return false;
        }

        if (user.role !== 'ADMIN') {
          this.redirectToUnauthorized();
          return false;
        }

        return true;
      })
    );
  }

  /**
   * Redirect to login page with return URL
   * @param returnUrl - URL to return to after login
   */
  private redirectToLogin(returnUrl: string): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl }
    });
  }

  /**
   * Redirect to unauthorized page
   */
  private redirectToUnauthorized(): void {
    this.router.navigate(['/unauthorized']);
  }
}
