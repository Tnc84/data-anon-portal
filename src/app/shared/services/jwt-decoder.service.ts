import { Injectable } from '@angular/core';

/**
 * Service for decoding JWT tokens
 * Follows Angular best practices: Single responsibility, no external dependencies
 */
@Injectable({
  providedIn: 'root'
})
export class JwtDecoderService {

  /**
   * Decode JWT token payload
   * @param token - JWT token string
   * @returns Decoded payload object or null if invalid
   */
  decodeToken(token: string): any {
    try {
      // JWT structure: header.payload.signature
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      
      // Decode base64
      const decodedPayload = atob(paddedPayload);
      
      // Parse JSON
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }

  /**
   * Get user information from JWT token
   * @param token - JWT token string
   * @returns User object or null if token is invalid
   */
  getUserFromToken(token: string): any {
    const payload = this.decodeToken(token);
    
    if (!payload) {
      return null;
    }

    // Extract user information from JWT payload
    // Adjust these field names based on your JWT structure
    return {
      id: payload.userId || payload.sub,
      username: payload.sub || payload.username,
      email: payload.email || `${payload.sub}@example.com`,
      role: payload.role || 'USER',
      firstName: payload.firstName || 'User',
      lastName: payload.lastName || '',
      // Add default values for missing fields to match User interface
      enabled: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
  }

  /**
   * Check if token is expired based on 'exp' claim
   * @param token - JWT token string
   * @returns true if token is expired
   */
  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    
    if (!payload || !payload.exp) {
      return true;
    }

    // JWT exp is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    return currentTime >= expirationTime;
  }

  /**
   * Get token expiration time in milliseconds
   * @param token - JWT token string
   * @returns Expiration time in milliseconds or null
   */
  getTokenExpiration(token: string): number | null {
    const payload = this.decodeToken(token);
    
    if (!payload || !payload.exp) {
      return null;
    }

    // Convert from seconds to milliseconds
    return payload.exp * 1000;
  }
}
