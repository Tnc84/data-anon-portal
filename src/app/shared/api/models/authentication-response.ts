/* eslint-disable */
/* Authentication response model */

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;           // "USER" | "ADMIN"
  enabled: boolean;
  createdAt: string;      // ISO date
  lastLogin: string;      // ISO date
}

export interface AuthenticationResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;       // "Bearer"
  expiresIn?: number;       // ms
  user?: User;
}
