import { Injectable } from '@angular/core';

/**
 * Token management service following Angular best practices
 * Handles secure token storage and retrieval
 * Single Responsibility: manages JWT tokens only
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly TOKEN_EXPIRY_KEY = 'tokenExpiry';

  /**
   * Store access token securely
   * @param token - JWT access token
   * @param expiresIn - Token expiry time in milliseconds
   */
  setAccessToken(token: string, expiresIn?: number): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    
    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn;
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
  }

  /**
   * Get stored access token
   * @returns Access token or null if not found/expired
   */
  getAccessToken(): string | null {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    
    if (!token) {
      return null;
    }

    // Check if token is expired
    if (this.isTokenExpired()) {
      this.clearTokens();
      return null;
    }

    return token;
  }

  /**
   * Store refresh token securely
   * @param token - Refresh token
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Get stored refresh token
   * @returns Refresh token or null if not found
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if access token is expired
   * @returns true if token is expired or expiry not set
   */
  isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (!expiryTime) {
      return false; // If no expiry set, assume token is still valid
    }

    return Date.now() >= parseInt(expiryTime, 10);
  }

  /**
   * Check if user has valid tokens (authenticated)
   * @returns true if user has valid access token
   */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Clear all stored tokens (logout)
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  /**
   * Get time until token expires in minutes
   * @returns Minutes until expiry or null if no expiry set
   */
  getTimeUntilExpiry(): number | null {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (!expiryTime) {
      return null;
    }

    const timeLeft = parseInt(expiryTime, 10) - Date.now();
    return Math.max(0, Math.floor(timeLeft / (1000 * 60)));
  }
}
