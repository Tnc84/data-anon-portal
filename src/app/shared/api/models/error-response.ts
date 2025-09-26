/* eslint-disable */
/* Error response model */

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  timestamp?: string;
}
