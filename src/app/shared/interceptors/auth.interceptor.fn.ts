import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, filter, take, throwError, Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP Interceptor for JWT token attachment and refresh handling
 * Modern Angular approach using HttpInterceptorFn
 */

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  console.log('🔍 Functional AuthInterceptor called for:', req.url);

  // Skip token attachment for auth endpoints (login, register, refresh)
  const authEndpoints = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh'];
  if (authEndpoints.some(endpoint => req.url.includes(endpoint))) {
    console.log('⏭️ Skipping auth endpoint:', req.url);
    return next(req);
  }

  // Check if token is expired or expiring soon before making the request
  if (tokenService.isTokenExpired()) {
    console.log('⚠️ Token expired, attempting refresh');
    if (tokenService.getRefreshToken()) {
      return handle401Error(req, next, tokenService, authService);
    } else {
      authService.logout().subscribe();
      return throwError(() => new Error('Token expired and no refresh token available'));
    }
  }

  // Check if token is expiring soon and refresh proactively
  if (tokenService.isTokenExpiringSoon() && tokenService.getRefreshToken() && !isRefreshing) {
    console.log('⚠️ Token expiring soon, attempting refresh');
    return handle401Error(req, next, tokenService, authService);
  }

  // Add JWT token to request
  const authenticatedRequest = addTokenToRequest(req, tokenService);
  
  const token = tokenService.getAccessToken();
  console.log('🔑 Token available:', !!token);
  console.log('📤 Request headers:', authenticatedRequest.headers.keys());
  
  if (token) {
    console.log('✅ Authorization header added');
  } else {
    console.log('❌ No token available to add');
  }

  return next(authenticatedRequest).pipe(
    catchError((error) => {
      console.log('❌ Request failed:', error.status, error.message);
      // Handle 401 Unauthorized responses
      if (error.status === 401 && tokenService.getRefreshToken()) {
        return handle401Error(authenticatedRequest, next, tokenService, authService);
      }
      
      return throwError(() => error);
    })
  );
};

/**
 * Add JWT token to request headers
 */
function addTokenToRequest(request: HttpRequest<unknown>, tokenService: TokenService): HttpRequest<unknown> {
  const token = tokenService.getAccessToken();
  
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
 */
function handle401Error(request: HttpRequest<unknown>, next: HttpHandlerFn, tokenService: TokenService, authService: AuthService): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken);
        
        // Retry the original request with new token
        return next(addTokenToRequest(request, tokenService));
      }),
      catchError((error) => {
        isRefreshing = false;
        
        // If refresh fails, logout user
        authService.logout().subscribe();
        
        return throwError(() => error);
      })
    );
  } else {
    // If refresh is already in progress, wait for it to complete
    return refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(() => next(addTokenToRequest(request, tokenService)))
    );
  }
}
