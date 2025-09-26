/* eslint-disable */
/* Authentication models for backend integration */

export interface AuthenticationRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}
