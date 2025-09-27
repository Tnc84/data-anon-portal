import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { 
  FileAnonymizationService, 
  FileAnonymizationResponse, 
  AnonymizationStrategy,
  FileUploadOptions 
} from '../../shared/services/file-anonymization.service';
import { AuthService } from '../../shared/services/auth.service';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';

@Component({
  selector: 'app-anonymization',
  imports: [CommonModule, FormsModule, HasRoleDirective],
  templateUrl: './anonymization.html',
  styleUrl: './anonymization.scss'
})
export class Anonymization implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fileAnonymizationService = inject(FileAnonymizationService);
  protected readonly authService = inject(AuthService);
  
  // Form state using Angular signals
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly selectedStrategy = signal<AnonymizationStrategy>('MASKING');
  protected readonly preserveFormat = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly result = signal<FileAnonymizationResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly anonymizedFiles = signal<string[]>([]);

  // Available strategies for the UI
  protected readonly availableStrategies = this.fileAnonymizationService.getAvailableStrategies();

  // Role-based UI state
  protected readonly currentUserRole = this.authService.getCurrentUserRole;
  protected readonly isAdmin = this.authService.isAdminSignal;

  /**
   * Handle file selection from input
   * Validates file type (CSV or text files)
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type - now supporting CSV and JSON
      const allowedTypes = ['.csv', '.json'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        this.error.set('File size exceeds 10MB limit.');
        this.selectedFile.set(null);
        input.value = '';
        return;
      }
      
      if (allowedTypes.includes(fileExtension)) {
        this.selectedFile.set(file);
        this.error.set(null);
      } else {
        this.error.set('Please select a CSV or JSON file.');
        this.selectedFile.set(null);
        input.value = '';
      }
    }
  }

  /**
   * Handle file upload and anonymization process
   * Uses the new file upload API endpoint
   */
  async onAnonymize(): Promise<void> {
    // Validate inputs
    if (!this.selectedFile()) {
      this.error.set('Please select a file to anonymize.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.result.set(null);

    try {
      // Prepare upload options
      const options: FileUploadOptions = {
        strategy: this.selectedStrategy(),
        preserveFormat: this.preserveFormat(),
        seed: Math.floor(Math.random() * 1000000),
        outputFileName: `${this.authService.currentUser()?.username || 'user'}_${this.selectedFile()!.name.split('.')[0]}_anon`
      };

      // Upload and anonymize file using the service
      this.fileAnonymizationService.uploadAndAnonymize(this.selectedFile()!, options).subscribe({
        next: (response) => {
          this.result.set(response);
          this.isLoading.set(false);
          // Refresh the file list
          this.loadAnonymizedFiles();
        },
        error: (error) => {
          this.error.set(`Anonymization failed: ${error.message || 'Unknown error'}`);
          this.isLoading.set(false);
          console.error('Anonymization error:', error);
        }
      });

    } catch (error) {
      this.error.set(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.isLoading.set(false);
    }
  }

  /**
   * Load list of anonymized files
   */
  loadAnonymizedFiles(): void {
    this.fileAnonymizationService.listFiles().subscribe({
      next: (files) => {
        this.anonymizedFiles.set(files);
      },
      error: (error) => {
        console.error('Failed to load file list:', error);
      }
    });
  }

  /**
   * Download an anonymized file
   */
  downloadAnonymizedFile(fileName: string): void {
    this.fileAnonymizationService.downloadAndSave(fileName);
  }

  /**
   * Delete an anonymized file (Admin only - UI restriction)
   * Note: Real security validation must be done on the backend
   */
  deleteFile(fileName: string): void {
    if (!this.isAdmin()) {
      console.warn('Delete operation attempted by non-admin user');
      return;
    }

    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      // TODO: Implement delete file API call when backend endpoint is available
      // For now, just remove from local list (demo purposes)
      this.anonymizedFiles.update(files => files.filter(f => f !== fileName));
      console.log(`File ${fileName} would be deleted (backend implementation needed)`);
    }
  }

  /**
   * Get strategy description for UI
   */
  getStrategyDescription(strategy: AnonymizationStrategy): string {
    return this.fileAnonymizationService.getStrategyDescription(strategy);
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.selectedFile.set(null);
    this.result.set(null);
    this.error.set(null);
    this.isLoading.set(false);
    
    // Clear file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Download the anonymized file from the server
   */
  downloadResult(): void {
    const result = this.result();
    if (!result || !result.anonymizedFileName) return;

    this.fileAnonymizationService.downloadAndSave(result.anonymizedFileName, result.originalFileName);
  }

  /**
   * Initialize component - load existing files
   */
  ngOnInit(): void {
    this.loadAnonymizedFiles();
  }
}
