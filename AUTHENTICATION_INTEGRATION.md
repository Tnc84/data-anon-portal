# Authentication Integration Documentation

## Overview

This document describes the complete authentication integration implemented in the Angular Data Anonymization Portal. The implementation follows Angular best practices including reactive programming, dependency injection, and modern Angular features.

## Architecture

### Core Components

1. **Authentication Models** (`src/app/shared/api/models/`)
   - `AuthenticationRequest` - Login credentials
   - `RegisterRequest` - User registration data
   - `AuthenticationResponse` - Server auth response with JWT tokens
   - `RefreshTokenRequest` - Token refresh payload
   - `ErrorResponse` - Standardized error responses

2. **Services** (`src/app/shared/services/`)
   - `AuthService` - Main authentication service with reactive state management
   - `TokenService` - JWT token storage and validation
   - `AnonymizationService` - Data anonymization operations (updated for auth)
   - `FileAnonymizationService` - File processing (updated for auth)

3. **Security Infrastructure** (`src/app/shared/`)
   - `AuthInterceptor` - HTTP interceptor for JWT attachment and 401 handling
   - `AuthGuard` - Route guard for protected routes
   - `RoleGuard` - Role-based access control

4. **UI Components** (`src/app/features/auth/`)
   - `AuthComponent` - Login/Register form with reactive validation
   - `UnauthorizedComponent` - Access denied page

## Key Features

### 🔐 JWT Token Management
- Automatic token attachment to HTTP requests
- Token expiry validation and refresh flow
- Secure localStorage storage
- Automatic logout on token expiry

### 🛡️ Route Protection
- Protected routes require authentication
- Role-based access control (USER/ADMIN)
- Automatic redirect to login for unauthorized access
- Return URL preservation after login

### 🔄 Reactive State Management
- Angular Signals for reactive UI updates
- RxJS Observables for async operations
- Centralized authentication state
- Real-time user status updates

### 📱 Modern UI/UX
- Responsive design with mobile support
- Beautiful gradient authentication forms
- Loading states and error handling
- Smooth transitions and animations

## Implementation Details

### Authentication Flow

1. **Login Process**
   ```typescript
   // User submits login form
   authService.login(credentials) → 
   // Server validates and returns JWT tokens
   // TokenService stores tokens securely
   // AuthService updates reactive state
   // User redirected to protected route
   ```

2. **Token Refresh Flow**
   ```typescript
   // HTTP request fails with 401
   // AuthInterceptor detects 401 error
   // Automatically calls refresh token endpoint
   // Updates stored tokens and retries request
   // If refresh fails, redirects to login
   ```

3. **Route Protection**
   ```typescript
   // User navigates to protected route
   // AuthGuard checks authentication status
   // If authenticated: allow navigation
   // If not authenticated: redirect to login with return URL
   ```

### Security Measures

- **JWT Token Validation**: Automatic expiry checking
- **HTTP Interceptor**: Centralized request/response handling
- **CSRF Protection**: Stateless JWT approach
- **Role-Based Access**: Granular permission control
- **Secure Storage**: localStorage with validation

### Error Handling

- **Network Errors**: Graceful degradation with user feedback
- **Authentication Errors**: Clear error messages
- **Token Expiry**: Automatic refresh or re-authentication
- **Server Errors**: Standardized error response handling

## Configuration

### Environment Setup
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080'
};
```

### App Configuration
```typescript
// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // HTTP Interceptor for JWT tokens
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
    // ... other providers
  ]
};
```

### Route Configuration
```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  {
    path: 'anonymization',
    loadComponent: () => import('./features/anonymization/anonymization.ts'),
    canActivate: [AuthGuard] // Protected route
  },
  // ... other routes
];
```

## API Integration

### Backend Endpoints
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/auth/profile` - User profile
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/status` - Authentication status

### Request Headers
All protected endpoints require:
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

## Usage Examples

### Service Injection
```typescript
@Component({...})
export class MyComponent {
  private readonly authService = inject(AuthService);
  
  // Reactive authentication state
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly currentUser = computed(() => this.authService.currentUser());
}
```

### Route Protection
```typescript
// Protect route with authentication
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AuthGuard]
}

// Protect route with role requirement
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [RoleGuard],
  data: { roles: ['ADMIN'] }
}
```

### Manual Authentication Check
```typescript
// Check if user is authenticated
if (this.authService.isAuthenticated()) {
  // User is logged in
}

// Check user role
if (this.authService.hasRole('ADMIN')) {
  // User is admin
}
```

## Best Practices Implemented

### Angular Principles
- ✅ **SOLID Principles**: Single responsibility, dependency injection
- ✅ **Reactive Programming**: RxJS observables, Angular signals
- ✅ **Separation of Concerns**: Services for business logic, components for UI
- ✅ **Immutable Data**: Reactive state updates
- ✅ **OnPush Change Detection**: Performance optimization

### Security Best Practices
- ✅ **JWT Token Security**: Proper storage and validation
- ✅ **HTTP Interceptors**: Centralized security handling
- ✅ **Route Guards**: Access control at navigation level
- ✅ **Error Handling**: Graceful failure management
- ✅ **Input Validation**: Client-side form validation

### Code Quality
- ✅ **TypeScript**: Strong typing throughout
- ✅ **Clean Code**: Readable, maintainable code structure
- ✅ **Documentation**: Comprehensive inline comments
- ✅ **Modular Design**: Reusable components and services
- ✅ **Responsive Design**: Mobile-first approach

## Testing Considerations

### Unit Testing
- Services can be easily mocked using Angular testing utilities
- HTTP interceptors can be tested with `HttpClientTestingModule`
- Guards can be tested with router testing utilities
- Components use reactive forms for easy validation testing

### Integration Testing
- Authentication flow can be tested end-to-end
- Route protection can be verified with navigation tests
- Token refresh flow can be simulated with HTTP mocks

## Deployment Notes

### Production Configuration
1. Update `environment.prod.ts` with production API URL
2. Enable HTTPS for secure token transmission
3. Configure proper CORS settings on backend
4. Set appropriate token expiry times
5. Monitor authentication metrics and errors

### Security Checklist
- [ ] HTTPS enabled for all communications
- [ ] Secure token storage implementation
- [ ] Proper CORS configuration
- [ ] Rate limiting on authentication endpoints
- [ ] Monitoring and logging for security events

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check token expiry and refresh logic
2. **CORS Errors**: Verify backend CORS configuration
3. **Route Navigation**: Ensure guards are properly configured
4. **Token Storage**: Verify localStorage availability

### Debug Tips
- Use browser dev tools to inspect network requests
- Check localStorage for token presence and validity
- Monitor console for authentication service logs
- Verify route guard execution order

## Future Enhancements

### Potential Improvements
- [ ] Social authentication (Google, GitHub)
- [ ] Multi-factor authentication (MFA)
- [ ] Session timeout warnings
- [ ] Remember me functionality with longer-lived tokens
- [ ] Audit logging for security events
- [ ] Password strength requirements
- [ ] Account lockout mechanisms

This authentication system provides a solid foundation for secure user management while maintaining Angular best practices and providing excellent user experience.
