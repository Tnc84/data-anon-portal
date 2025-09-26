/* eslint-disable */
/* API model for file anonymization response */

/**
 * Response interface for file upload and anonymization operations
 */
export interface FileAnonymizationResponse {
  success: boolean;
  message: string;
  originalFileName: string;
  anonymizedFileName: string;
  filePath: string;
  strategy: string;
  recordsProcessed: number;
  fieldsProcessed: number;
  fileSize: number;
  downloadUrl: string;
}
