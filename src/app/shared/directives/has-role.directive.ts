import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Structural directive for role-based conditional rendering
 * Usage: *hasRole="'ADMIN'" or *hasRole="['USER', 'ADMIN']"
 * 
 * Follows Angular best practices: structural directive, reactive programming
 * Single Responsibility: conditionally render elements based on user role
 * 
 * IMPORTANT: This is for UI/UX only - real security must be enforced on the backend
 */
@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);

  private requiredRoles: string[] = [];
  private hasView = false;

  constructor() {
    // React to changes in user role
    effect(() => {
      const currentRole = this.authService.getCurrentUserRole();
      this.updateView(currentRole);
    });
  }

  /**
   * Set required role(s) for displaying the element
   * @param roles - Single role string or array of roles
   */
  @Input() set hasRole(roles: string | string[]) {
    this.requiredRoles = Array.isArray(roles) ? roles : [roles];
    const currentRole = this.authService.getCurrentUserRole();
    this.updateView(currentRole);
  }

  /**
   * Update view based on current user role
   * @param currentRole - Current user's role
   */
  private updateView(currentRole: string | null): void {
    const hasRequiredRole = currentRole && this.requiredRoles.includes(currentRole);

    if (hasRequiredRole && !this.hasView) {
      // Show element
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRequiredRole && this.hasView) {
      // Hide element
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
