import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AnonymizationRequest, AnonymizationResponse } from '../api/models';

/**
 * Batch anonymization request interface
 */
export interface BatchAnonymizationRequest {
  datasets: Record<string, Record<string, any>>;
  strategy?: string;
  preserveFormat?: boolean;
  seed?: number;
}

/**
 * Anonymization service for data processing operations
 * Follows Angular best practices: Dependency Injection, reactive programming
 * Single Responsibility: handles data anonymization operations
 */
@Injectable({
  providedIn: 'root'
})
export class AnonymizationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/anonymization`;

  /**
   * Quick anonymize data with default settings
   * @param data - Data to anonymize
   * @returns Observable with anonymized data
   */
  quickAnonymize(data: Record<string, any>): Observable<Record<string, any>> {
    return this.http.post<Record<string, any>>(`${this.baseUrl}/quick-anonymize`, data);
  }

  /**
   * Anonymize data with specific strategy and options
   * @param request - Anonymization request with strategy and options
   * @returns Observable with detailed anonymization response
   */
  anonymize(request: AnonymizationRequest): Observable<AnonymizationResponse> {
    return this.http.post<AnonymizationResponse>(`${this.baseUrl}/anonymize`, request);
  }

  /**
   * Batch anonymize multiple datasets
   * @param request - Batch anonymization request
   * @returns Observable with batch anonymization results
   */
  batchAnonymize(request: BatchAnonymizationRequest): Observable<Record<string, any>> {
    return this.http.post<Record<string, any>>(`${this.baseUrl}/batch-anonymize`, request);
  }

  /**
   * Get available anonymization strategies
   * @returns Observable with available strategies and their descriptions
   */
  getAvailableStrategies(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.baseUrl}/strategies`);
  }

  /**
   * Check anonymization service health
   * @returns Observable with health status
   */
  healthCheck(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.baseUrl}/health`);
  }

  /**
   * Create anonymization request with validation
   * @param data - Data to anonymize
   * @param strategy - Anonymization strategy
   * @param preserveFormat - Whether to preserve original format
   * @param seed - Optional seed for reproducible results
   * @returns Validated anonymization request
   */
  createAnonymizationRequest(
    data: Record<string, any>,
    strategy: string = 'MASKING',
    preserveFormat: boolean = true,
    seed?: number
  ): AnonymizationRequest {
    // Validate input data
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Data cannot be empty');
    }

    // Validate strategy
    const validStrategies = ['MASKING', 'PSEUDONYMIZATION', 'SHUFFLING', 'REDACTION', 'FORMAT_PRESERVING_ENCRYPTION'];
    if (!validStrategies.includes(strategy)) {
      throw new Error(`Invalid strategy: ${strategy}. Valid strategies: ${validStrategies.join(', ')}`);
    }

    const request: AnonymizationRequest = {
      data,
      strategy,
      preserveFormat
    };

    if (seed !== undefined) {
      request.seed = seed;
    }

    return request;
  }

  /**
   * Create batch anonymization request with validation
   * @param datasets - Multiple datasets to anonymize
   * @param strategy - Anonymization strategy
   * @param preserveFormat - Whether to preserve original format
   * @param seed - Optional seed for reproducible results
   * @returns Validated batch anonymization request
   */
  createBatchRequest(
    datasets: Record<string, Record<string, any>>,
    strategy: string = 'MASKING',
    preserveFormat: boolean = true,
    seed?: number
  ): BatchAnonymizationRequest {
    // Validate datasets
    if (!datasets || Object.keys(datasets).length === 0) {
      throw new Error('Datasets cannot be empty');
    }

    // Validate each dataset
    Object.entries(datasets).forEach(([name, data]) => {
      if (!data || Object.keys(data).length === 0) {
        throw new Error(`Dataset '${name}' cannot be empty`);
      }
    });

    const request: BatchAnonymizationRequest = {
      datasets,
      strategy,
      preserveFormat
    };

    if (seed !== undefined) {
      request.seed = seed;
    }

    return request;
  }
}
