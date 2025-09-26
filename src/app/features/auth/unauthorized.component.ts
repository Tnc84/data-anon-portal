import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Unauthorized access component
 * Displays when user doesn't have permission to access a route
 */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-content">
        <div class="icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        
        <div class="actions">
          <button (click)="goBack()" class="btn btn-secondary">
            Go Back
          </button>
          <button (click)="goHome()" class="btn btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      padding: 1rem;
    }

    .unauthorized-content {
      text-align: center;
      max-width: 400px;
    }

    .icon {
      color: #e74c3c;
      margin-bottom: 1.5rem;
    }

    .icon svg {
      width: 80px;
      height: 80px;
    }

    h1 {
      color: #333;
      margin: 0 0 1rem 0;
      font-size: 2rem;
      font-weight: 600;
    }

    p {
      color: #666;
      margin: 0 0 2rem 0;
      font-size: 1.1rem;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      min-width: 120px;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn-secondary:hover {
      background: #667eea;
      color: white;
      transform: translateY(-1px);
    }

    @media (max-width: 640px) {
      .actions {
        flex-direction: column;
        align-items: center;
      }

      .btn {
        width: 100%;
        max-width: 200px;
      }
    }
  `]
})
export class UnauthorizedComponent {
  private readonly router = inject(Router);

  /**
   * Navigate back to previous page
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * Navigate to home/dashboard
   */
  goHome(): void {
    this.router.navigate(['/anonymization']);
  }
}
