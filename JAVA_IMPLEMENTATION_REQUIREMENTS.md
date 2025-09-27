# 📋 JAVA IMPLEMENTATION REQUIREMENTS

## **🔐 AUTHENTICATION & JWT TOKEN SYSTEM**

### **1. JWT Token Configuration**
```java
// Token expiration times
ACCESS_TOKEN_EXPIRATION = 15 minutes
REFRESH_TOKEN_EXPIRATION = 7 days

// JWT Claims to include:
- subject: username
- role: user role (USER, ADMIN, etc.)
- userId: user ID
- exp: expiration timestamp
- iat: issued at timestamp
```

### **2. JWT Authentication Filter**
**Required:** `JwtAuthenticationFilter extends OncePerRequestFilter`

**Must implement:**
- Extract Bearer token from `Authorization` header
- Validate token signature and expiration
- Extract user role and ID from token claims
- Set Spring Security Authentication context
- Handle expired/invalid tokens with 401 response

**Protected endpoints:**
- All `/api/v1/anonymization/**` endpoints require authentication
- Role-based access control for future admin endpoints

### **3. Authentication Controller Endpoints**

#### **POST /api/v1/auth/login**
```json
Request: {
  "usernameOrEmail": "string",
  "password": "string", 
  "rememberMe": boolean
}

Response: {
  "success": true,
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token", 
  "expiresIn": 900000,
  "user": {
    "id": "userId",
    "username": "username",
    "email": "email",
    "role": "USER|ADMIN",
    "firstName": "string",
    "lastName": "string"
  },
  "message": "Login successful"
}
```

#### **POST /api/v1/auth/refresh**
```json
Request: {
  "refreshToken": "jwt_refresh_token"
}

Response: {
  "success": true,
  "accessToken": "new_jwt_access_token",
  "refreshToken": "new_jwt_refresh_token", // Optional: rotate refresh token
  "expiresIn": 900000,
  "user": { /* user object */ }
}
```

#### **GET /api/v1/auth/profile**
- Requires valid JWT token
- Returns current user profile information

#### **POST /api/v1/auth/logout**
- Invalidate refresh token (add to blacklist if needed)
- Return success response

---

## **🛡️ ROLE-BASED ACCESS CONTROL (RBAC)**

### **4. User Roles System**
```java
public enum UserRole {
    USER,    // Regular users - can anonymize data
    ADMIN    // Administrators - full access including admin endpoints
}
```

### **5. Role-Based Endpoint Protection**

#### **Current Endpoints (USER role required):**
```java
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
@GetMapping("/api/v1/anonymization/strategies")

@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")  
@PostMapping("/api/v1/anonymization/anonymize")

@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
@PostMapping("/api/v1/anonymization/upload-anonymize")

@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
@GetMapping("/api/v1/anonymization/download/{fileName}")
```

#### **Future Admin Endpoints (ADMIN role only):**
```java
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/api/v1/admin/users")           // List all users

@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/api/v1/admin/files")           // List all anonymized files

@PreAuthorize("hasRole('ADMIN')")  
@DeleteMapping("/api/v1/admin/files/{id}")   // Delete any file

@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/api/v1/admin/statistics")      // System statistics

@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/api/v1/admin/users/{id}/role") // Change user role
```

### **6. Role Validation Implementation**
```java
// Method-level security
@EnableGlobalMethodSecurity(prePostEnabled = true)

// Custom role checker
@Component
public class RoleChecker {
    public boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream()
            .anyMatch(grantedAuth -> grantedAuth.getAuthority().equals("ROLE_" + role));
    }
    
    public boolean isAdmin() {
        return hasRole("ADMIN");
    }
}
```

---

## **🔧 SECURITY CONFIGURATION**

### **7. Spring Security Configuration**
```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors().and().csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .authorizeHttpRequests(authz -> authz
                // Public endpoints
                .requestMatchers("/api/v1/auth/login", "/api/v1/auth/register").permitAll()
                .requestMatchers("/api/v1/auth/refresh").permitAll()
                
                // User endpoints  
                .requestMatchers("/api/v1/anonymization/**").hasAnyRole("USER", "ADMIN")
                
                // Admin endpoints
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    }
}
```

### **8. CORS Configuration**
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of("http://localhost:4200"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

---

## **📊 ERROR HANDLING**

### **9. Authentication Error Responses**
```java
// 401 Unauthorized
{
  "success": false,
  "message": "Invalid credentials",
  "timestamp": "2024-01-01T12:00:00Z",
  "status": 401
}

// 403 Forbidden (insufficient role)
{
  "success": false, 
  "message": "Access denied. Admin role required",
  "timestamp": "2024-01-01T12:00:00Z",
  "status": 403
}

// 401 Token Expired
{
  "success": false,
  "message": "Token expired",
  "timestamp": "2024-01-01T12:00:00Z", 
  "status": 401
}
```

---

## **🧪 TESTING REQUIREMENTS**

### **10. Integration Tests Needed**
- [ ] Login with valid credentials returns JWT tokens
- [ ] Login with invalid credentials returns 401
- [ ] Protected endpoints reject requests without Bearer token
- [ ] Protected endpoints accept requests with valid Bearer token
- [ ] Token refresh works with valid refresh token
- [ ] Token refresh fails with invalid refresh token
- [ ] Role-based access: USER can access anonymization endpoints
- [ ] Role-based access: ADMIN can access admin endpoints
- [ ] Role-based access: USER cannot access admin endpoints
- [ ] CORS headers work correctly for Angular frontend

---

## **🎯 PRIORITY IMPLEMENTATION ORDER**

1. **HIGH PRIORITY** - JWT Authentication Filter & Token Validation
2. **HIGH PRIORITY** - Login/Refresh endpoints with proper JWT generation
3. **HIGH PRIORITY** - Role extraction and validation from JWT tokens
4. **MEDIUM PRIORITY** - Role-based endpoint protection for existing anonymization APIs
5. **LOW PRIORITY** - Future admin endpoints (implement when needed)

---

## **📝 ADDITIONAL NOTES**

- **Token Storage:** Consider Redis for refresh token blacklisting on logout
- **Password Security:** Use BCrypt with minimum 10 rounds for password hashing
- **Logging:** Log all authentication attempts and role-based access denials
- **Rate Limiting:** Consider implementing rate limiting on auth endpoints
- **Token Rotation:** Optionally rotate refresh tokens on each refresh request for enhanced security

**Angular frontend is ready and will automatically:**
- Attach Bearer tokens to all API requests
- Handle token refresh before expiration
- Redirect to login when tokens are invalid
- Support role-based UI features when admin endpoints are added

---

## **🔄 COMPLETE AUTHENTICATION FLOW**

### **Expected Flow:**
1. User visits `http://localhost:4200/anonymization`
2. Angular AuthGuard detects no authentication → redirects to `http://localhost:4200/login?returnUrl=%2Fanonymization`
3. User logs in → `POST http://localhost:8080/api/v1/auth/login` with credentials
4. Java backend validates credentials and returns JWT tokens
5. Angular stores tokens and redirects to `/anonymization`
6. User requests strategies → `GET http://localhost:8080/api/v1/anonymization/strategies`
7. Angular AuthInterceptor automatically attaches `Bearer <token>` header
8. Java backend validates JWT token and serves the request
9. If token expires, Angular automatically refreshes it before the request
10. All subsequent requests have valid Bearer tokens attached

### **Token Validation on Every Request:**
- Extract Bearer token from Authorization header
- Validate token signature using secret key
- Check token expiration timestamp
- Extract user role from token claims
- Verify user has required role for the endpoint
- Return 401 if token is invalid/expired
- Return 403 if user lacks required role

---

## **📋 IMPLEMENTATION CHECKLIST**

### **Core Authentication:**
- [ ] JWT Service for token generation and validation
- [ ] JWT Authentication Filter for request interception
- [ ] User entity with role field
- [ ] UserDetailsService implementation
- [ ] Password encoder configuration

### **Controllers:**
- [ ] AuthController with login/refresh/logout endpoints
- [ ] Profile endpoint for user information
- [ ] Proper error handling and response formatting

### **Security:**
- [ ] Spring Security configuration
- [ ] CORS configuration for Angular frontend
- [ ] Method-level security annotations
- [ ] Role-based access control

### **Database:**
- [ ] User table with role column
- [ ] Optional: refresh token blacklist table
- [ ] User repository with findByUsernameOrEmail method

### **Testing:**
- [ ] Unit tests for JWT service
- [ ] Integration tests for authentication flow
- [ ] Role-based access control tests
- [ ] CORS and preflight request tests

---

*This document provides complete requirements for implementing JWT authentication with role-based access control in the Java backend. The Angular frontend is already implemented and ready to work with these backend changes.*
