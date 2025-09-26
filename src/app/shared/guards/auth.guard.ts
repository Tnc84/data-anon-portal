import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

/**
 * Authentication guard for protecting routes
 * Follows Angular best practices: functional guards, reactive programming
 * Single Responsibility: controls route access based on authentication state
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  /**
   * Check if route can be activated based on authentication status
   * @param route - Activated route snapshot
   * @param state - Router state snapshot
   * @returns Observable<boolean> indicating if route can be activated
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuthentication(state.url);
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
   * Check authentication status and redirect if necessary
   * @param url - Attempted URL
   * @returns Observable<boolean> indicating authentication status
   */
  private checkAuthentication(url: string): Observable<boolean> {
    // Check if user has valid token
    if (!this.tokenService.isAuthenticated()) {
      this.redirectToLogin(url);
      return new Observable(subscriber => subscriber.next(false));
    }

    // Use the reactive authentication state from AuthService
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        } else {
          // If no user data but token exists, try to load profile
          this.authService.getProfile().subscribe({
            error: () => {
              // If profile loading fails, redirect to login
              this.redirectToLogin(url);
            }
          });
          return true; // Allow navigation while profile is loading
        }
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
}

/**
 * Role-based authentication guard
 * Extends AuthGuard to check for specific user roles
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly authGuard = inject(AuthGuard);
  private readonly router = inject(Router);

  /**
   * Check if route can be activated based on user role
   * @param route - Activated route snapshot (should contain 'roles' data)
   * @param state - Router state snapshot
   * @returns Observable<boolean> indicating if route can be activated
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // First check authentication
    const authResult = this.authGuard.canActivate(route, state);
    
    if (authResult === false) {
      return false;
    }

    // Check for required roles in route data
    const requiredRoles = route.data['roles'] as string[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No specific roles required
    }

    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        const hasRequiredRole = requiredRoles.includes(user.role);
        
        if (!hasRequiredRole) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}
