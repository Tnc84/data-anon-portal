import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

/**
 * Response interface for file upload and anonymization
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

/**
 * Available anonymization strategies
 */
export type AnonymizationStrategy = 'MASKING' | 'PSEUDONYMIZATION' | 'REDACTION' | 'FORMAT_PRESERVING_ENCRYPTION';

/**
 * File upload options interface
 */
export interface FileUploadOptions {
  strategy?: AnonymizationStrategy;
  preserveFormat?: boolean;
  seed?: number;
  outputFileName?: string;
}

/**
 * Service for handling file anonymization operations
 * Follows Angular best practices: Dependency Injection, Observable patterns, separation of concerns
 */
@Injectable({
  providedIn: 'root'
})
export class FileAnonymizationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/anonymization`;

  /**
   * Upload and anonymize a file
   * @param file - File to be anonymized (CSV or JSON)
   * @param options - Anonymization options (strategy, format preservation, etc.)
   * @returns Observable with anonymization response
   */
  uploadAndAnonymize(file: File, options: FileUploadOptions = {}): Observable<FileAnonymizationResponse> {
    // Validate file type
    if (!this.isValidFileType(file)) {
      throw new Error('Invalid file type. Only CSV and JSON files are supported.');
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit.');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    // Apply default options and append to form data
    const {
      strategy = 'MASKING',
      preserveFormat = true,
      seed,
      outputFileName
    } = options;

    formData.append('strategy', strategy);
    formData.append('preserveFormat', preserveFormat.toString());
    
    if (seed !== undefined) {
      formData.append('seed', seed.toString());
    }
    
    if (outputFileName) {
      formData.append('outputFileName', outputFileName);
    }

    // Use multipart/form-data content type (automatically set by HttpClient with FormData)
    return this.http.post<FileAnonymizationResponse>(
      `${this.baseUrl}/upload-anonymize`,
      formData
    );
  }

  /**
   * Download an anonymized file
   * @param fileName - Name of the file to download
   * @returns Observable with file blob
   */
  downloadFile(fileName: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${fileName}`, {
      responseType: 'blob'
    });
  }

  /**
   * List all anonymized files
   * @returns Observable with array of file names
   */
  listFiles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/files`);
  }

  /**
   * Download file and trigger browser download
   * @param fileName - Name of the file to download
   * @param originalName - Optional original name for the downloaded file
   */
  downloadAndSave(fileName: string, originalName?: string): void {
    this.downloadFile(fileName).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = originalName || fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Download failed:', error);
        throw new Error('Failed to download file');
      }
    });
  }

  /**
   * Validate if file type is supported
   * @param file - File to validate
   * @returns true if file type is valid
   */
  private isValidFileType(file: File): boolean {
    const allowedTypes = ['text/csv', 'application/json'];
    const allowedExtensions = ['.csv', '.json'];
    
    // Check MIME type
    if (allowedTypes.includes(file.type)) {
      return true;
    }
    
    // Check file extension as fallback
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Get available anonymization strategies
   * @returns Array of available strategies
   */
  getAvailableStrategies(): AnonymizationStrategy[] {
    return ['MASKING', 'PSEUDONYMIZATION', 'REDACTION', 'FORMAT_PRESERVING_ENCRYPTION'];
  }

  /**
   * Get strategy description for UI display
   * @param strategy - Anonymization strategy
   * @returns Human-readable description
   */
  getStrategyDescription(strategy: AnonymizationStrategy): string {
    const descriptions = {
      'MASKING': 'Replace sensitive data with asterisks or similar characters',
      'PSEUDONYMIZATION': 'Replace data with consistent fake values',
      'REDACTION': 'Remove or black out sensitive information',
      'FORMAT_PRESERVING_ENCRYPTION': 'Encrypt while maintaining original format'
    };
    
    return descriptions[strategy] || 'Unknown strategy';
  }
}
