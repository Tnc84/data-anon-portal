import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, of } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { 
  AuthenticationRequest, 
  RegisterRequest, 
  RefreshTokenRequest,
  AuthenticationResponse, 
  User,
  ErrorResponse 
} from '../api/models';

/**
 * Authentication service following Angular best practices
 * Implements reactive programming with RxJS and Angular signals
 * Single Responsibility: handles all authentication operations
 * Uses Dependency Injection for all dependencies
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/auth`;

  // Reactive state management with signals
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  private readonly isAuthenticatedSignal = signal<boolean>(false);
  private readonly isLoadingSignal = signal<boolean>(false);

  // Public reactive state
  public readonly currentUser$ = this.currentUserSubject.asObservable();
  public readonly isAuthenticated = computed(() => this.isAuthenticatedSignal());
  public readonly isLoading = computed(() => this.isLoadingSignal());
  public readonly currentUser = computed(() => this.currentUserSubject.value);

  constructor() {
    // Initialize authentication state on service creation
    this.initializeAuthState();
  }

  /**
   * Login user with credentials
   * @param credentials - Username/email and password
   * @returns Observable with authentication response
   */
  login(credentials: AuthenticationRequest): Observable<AuthenticationResponse> {
    this.isLoadingSignal.set(true);
    
    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => this.handleAuthError(error)),
        tap(() => this.isLoadingSignal.set(false))
      );
  }

  /**
   * Register new user
   * @param userData - User registration data
   * @returns Observable with authentication response
   */
  register(userData: RegisterRequest): Observable<AuthenticationResponse> {
    this.isLoadingSignal.set(true);
    
    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/register`, userData)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => this.handleAuthError(error)),
        tap(() => this.isLoadingSignal.set(false))
      );
  }

  /**
   * Refresh access token using refresh token
   * @returns Observable with new authentication response
   */
  refreshToken(): Observable<AuthenticationResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    
    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/refresh`, request)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  /**
   * Get current user profile
   * @returns Observable with user profile data
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile`)
      .pipe(
        tap(user => this.currentUserSubject.next(user)),
        catchError(error => this.handleAuthError(error))
      );
  }

  /**
   * Logout user and clear tokens
   * @returns Observable for logout completion
   */
  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {})
      .pipe(
        tap(() => this.handleLogout()),
        catchError(() => {
          // Even if logout fails on server, clear local tokens
          this.handleLogout();
          return of(null);
        })
      );
  }

  /**
   * Get authentication status from server
   * @returns Observable with auth status
   */
  getAuthStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/status`);
  }

  /**
   * Get authentication statistics
   * @returns Observable with auth stats
   */
  getAuthStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stats`);
  }

  /**
   * Check if current user has specific role
   * @param role - Role to check
   * @returns true if user has the role
   */
  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === role;
  }

  /**
   * Check if current user is admin
   * @returns true if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private initializeAuthState(): void {
    const isAuthenticated = this.tokenService.isAuthenticated();
    this.isAuthenticatedSignal.set(isAuthenticated);
    
    if (isAuthenticated) {
      // Optionally load user profile on initialization
      this.getProfile().subscribe({
        error: () => {
          // If profile loading fails, user might not be properly authenticated
          this.logout();
        }
      });
    }
  }

  /**
   * Handle successful authentication response
   * @param response - Authentication response from server
   */
  private handleAuthSuccess(response: AuthenticationResponse): void {
    if (response.success && response.accessToken) {
      // Store tokens
      this.tokenService.setAccessToken(response.accessToken, response.expiresIn);
      
      if (response.refreshToken) {
        this.tokenService.setRefreshToken(response.refreshToken);
      }

      // Update reactive state
      this.isAuthenticatedSignal.set(true);
      
      if (response.user) {
        this.currentUserSubject.next(response.user);
      }
    }
  }

  /**
   * Handle authentication errors
   * @param error - Error response
   * @returns Observable error
   */
  private handleAuthError(error: any): Observable<never> {
    this.isLoadingSignal.set(false);
    
    // Handle different error scenarios
    if (error.status === 401) {
      this.logout();
    }
    
    return throwError(() => error);
  }

  /**
   * Handle logout cleanup
   */
  private handleLogout(): void {
    this.tokenService.clearTokens();
    this.isAuthenticatedSignal.set(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}
