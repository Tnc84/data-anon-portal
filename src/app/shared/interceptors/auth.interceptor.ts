import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, filter, take, switchMap, catchError } from 'rxjs';

import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor for JWT token attachment and refresh handling
 * Follows Angular best practices: Dependency Injection, reactive programming
 * Single Responsibility: handles HTTP request authentication and token refresh
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  /**
   * Intercept HTTP requests to add JWT token and handle 401 responses
   * @param request - HTTP request
   * @param next - Next handler in the chain
   * @returns Observable of HTTP events
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip token attachment for auth endpoints (login, register, refresh)
    if (this.isAuthEndpoint(request.url)) {
      return next.handle(request);
    }

    // Add JWT token to request
    const authenticatedRequest = this.addTokenToRequest(request);

    return next.handle(authenticatedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized responses
        if (error.status === 401 && this.tokenService.getRefreshToken()) {
          return this.handle401Error(authenticatedRequest, next);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Add JWT token to request headers
   * @param request - Original HTTP request
   * @returns Request with Authorization header
   */
  private addTokenToRequest(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.tokenService.getAccessToken();
    
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return request;
  }

  /**
   * Handle 401 Unauthorized error with token refresh
   * @param request - Failed HTTP request
   * @param next - Next handler in the chain
   * @returns Observable of HTTP events after token refresh
   */
  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.accessToken);
          
          // Retry the original request with new token
          return next.handle(this.addTokenToRequest(request));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          
          // If refresh fails, logout user
          this.authService.logout().subscribe();
          
          return throwError(() => error);
        })
      );
    } else {
      // If refresh is already in progress, wait for it to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => next.handle(this.addTokenToRequest(request)))
      );
    }
  }

  /**
   * Check if the request URL is an authentication endpoint
   * @param url - Request URL
   * @returns true if it's an auth endpoint
   */
  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/refresh'
    ];
    
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }
}
