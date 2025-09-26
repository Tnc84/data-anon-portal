import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../shared/services/auth.service';
import { AuthenticationRequest, RegisterRequest } from '../../shared/api/models';

/**
 * Authentication component for login and registration
 * Follows Angular best practices: reactive forms, signals, OnPush change detection
 * Single Responsibility: handles user authentication UI and form validation
 */
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>{{ isLoginMode() ? 'Sign In' : 'Create Account' }}</h1>
          <p>{{ isLoginMode() ? 'Welcome back!' : 'Join our data anonymization platform' }}</p>
        </div>

        <div class="auth-toggle">
          <button 
            type="button" 
            class="toggle-btn"
            [class.active]="isLoginMode()"
            (click)="setMode(true)">
            Sign In
          </button>
          <button 
            type="button" 
            class="toggle-btn"
            [class.active]="!isLoginMode()"
            (click)="setMode(false)">
            Sign Up
          </button>
        </div>

        <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="auth-form">
          <!-- Registration-only fields -->
          <div *ngIf="!isLoginMode()" class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                formControlName="firstName"
                [class.error]="isFieldInvalid('firstName')"
                placeholder="Enter your first name">
              <div *ngIf="isFieldInvalid('firstName')" class="error-message">
                First name is required
              </div>
            </div>
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                formControlName="lastName"
                [class.error]="isFieldInvalid('lastName')"
                placeholder="Enter your last name">
              <div *ngIf="isFieldInvalid('lastName')" class="error-message">
                Last name is required
              </div>
            </div>
          </div>

          <div *ngIf="!isLoginMode()" class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              type="text"
              formControlName="username"
              [class.error]="isFieldInvalid('username')"
              placeholder="Choose a username">
            <div *ngIf="isFieldInvalid('username')" class="error-message">
              <span *ngIf="authForm.get('username')?.errors?.['required']">Username is required</span>
              <span *ngIf="authForm.get('username')?.errors?.['minlength']">Username must be at least 3 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">{{ isLoginMode() ? 'Username or Email' : 'Email' }}</label>
            <input
              id="email"
              type="email"
              [formControlName]="isLoginMode() ? 'usernameOrEmail' : 'email'"
              [class.error]="isFieldInvalid(isLoginMode() ? 'usernameOrEmail' : 'email')"
              [placeholder]="isLoginMode() ? 'Enter username or email' : 'Enter your email'">
            <div *ngIf="isFieldInvalid(isLoginMode() ? 'usernameOrEmail' : 'email')" class="error-message">
              <span *ngIf="isLoginMode()">Username or email is required</span>
              <span *ngIf="!isLoginMode() && authForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="!isLoginMode() && authForm.get('email')?.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              [class.error]="isFieldInvalid('password')"
              placeholder="Enter your password">
            <div *ngIf="isFieldInvalid('password')" class="error-message">
              <span *ngIf="authForm.get('password')?.errors?.['required']">Password is required</span>
              <span *ngIf="authForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</span>
            </div>
          </div>

          <div *ngIf="isLoginMode()" class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="rememberMe">
              <span class="checkmark"></span>
              Remember me
            </label>
          </div>

          <div *ngIf="errorMessage()" class="error-banner">
            {{ errorMessage() }}
          </div>

          <button 
            type="submit" 
            class="submit-btn"
            [disabled]="authForm.invalid || isLoading()"
            [class.loading]="isLoading()">
            <span *ngIf="!isLoading()">{{ isLoginMode() ? 'Sign In' : 'Create Account' }}</span>
            <span *ngIf="isLoading()" class="loading-spinner"></span>
          </button>
        </form>

        <div class="auth-footer">
          <p *ngIf="isLoginMode()">
            Don't have an account? 
            <button type="button" class="link-btn" (click)="setMode(false)">Sign up</button>
          </p>
          <p *ngIf="!isLoginMode()">
            Already have an account? 
            <button type="button" class="link-btn" (click)="setMode(true)">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .auth-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 480px;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-header h1 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.75rem;
      font-weight: 600;
    }

    .auth-header p {
      margin: 0;
      color: #666;
      font-size: 0.95rem;
    }

    .auth-toggle {
      display: flex;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 2rem;
    }

    .toggle-btn {
      flex: 1;
      padding: 0.75rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      color: #666;
    }

    .toggle-btn.active {
      background: white;
      color: #333;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 500;
      color: #333;
      font-size: 0.9rem;
    }

    .form-group input {
      padding: 0.875rem;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-group input.error {
      border-color: #e74c3c;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
      color: #666;
    }

    .checkbox-label input[type="checkbox"] {
      margin: 0;
    }

    .error-banner {
      background: #fee;
      color: #e74c3c;
      padding: 0.875rem;
      border-radius: 8px;
      border: 1px solid #fcc;
      font-size: 0.9rem;
      text-align: center;
    }

    .submit-btn {
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;
    }

    .auth-footer p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .link-btn {
      background: none;
      border: none;
      color: #667eea;
      cursor: pointer;
      font-weight: 500;
      text-decoration: underline;
    }

    .link-btn:hover {
      color: #5a67d8;
    }

    @media (max-width: 640px) {
      .auth-card {
        padding: 1.5rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AuthComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Reactive state with signals
  private readonly isLoginModeSignal = signal(true);
  private readonly errorMessageSignal = signal<string>('');

  // Computed properties
  readonly isLoginMode = computed(() => this.isLoginModeSignal());
  readonly errorMessage = computed(() => this.errorMessageSignal());
  readonly isLoading = computed(() => this.authService.isLoading());

  // Reactive form
  authForm: FormGroup;

  constructor() {
    this.authForm = this.createForm();
    
    // Watch for mode changes and recreate form
    effect(() => {
      this.isLoginModeSignal(); // Read the signal to establish dependency
      this.authForm = this.createForm();
      this.errorMessageSignal.set('');
    });
  }

  /**
   * Create reactive form based on current mode
   */
  private createForm(): FormGroup {
    const isLogin = this.isLoginModeSignal();
    
    if (isLogin) {
      return this.fb.group({
        usernameOrEmail: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        rememberMe: [false]
      });
    } else {
      return this.fb.group({
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    }
  }

  /**
   * Set authentication mode (login/register)
   */
  setMode(isLogin: boolean): void {
    this.isLoginModeSignal.set(isLogin);
  }

  /**
   * Check if form field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.authForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.authForm.valid) {
      this.errorMessageSignal.set('');
      
      if (this.isLoginModeSignal()) {
        this.handleLogin();
      } else {
        this.handleRegister();
      }
    }
  }

  /**
   * Handle login submission
   */
  private handleLogin(): void {
    const credentials: AuthenticationRequest = {
      usernameOrEmail: this.authForm.value.usernameOrEmail,
      password: this.authForm.value.password,
      rememberMe: this.authForm.value.rememberMe
    };

    this.authService.login(credentials)
      .pipe(finalize(() => {}))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Get return URL or default to anonymization page
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/anonymization';
            this.router.navigate([returnUrl]);
          } else {
            this.errorMessageSignal.set(response.message || 'Login failed');
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.errorMessageSignal.set(
            error.error?.message || 'Login failed. Please check your credentials.'
          );
        }
      });
  }

  /**
   * Handle registration submission
   */
  private handleRegister(): void {
    const userData: RegisterRequest = {
      firstName: this.authForm.value.firstName,
      lastName: this.authForm.value.lastName,
      username: this.authForm.value.username,
      email: this.authForm.value.email,
      password: this.authForm.value.password
    };

    this.authService.register(userData)
      .pipe(finalize(() => {}))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Registration successful, redirect to anonymization page
            this.router.navigate(['/anonymization']);
          } else {
            this.errorMessageSignal.set(response.message || 'Registration failed');
          }
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.errorMessageSignal.set(
            error.error?.message || 'Registration failed. Please try again.'
          );
        }
      });
  }
}
