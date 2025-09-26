import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('data-anon-portal');
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Computed properties for template
  protected readonly currentUser = computed(() => this.authService.currentUser());

  /**
   * Handle user logout
   */
  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if logout fails, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }
}
