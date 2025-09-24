import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

@Component({
  selector: 'app-anonymization',
  imports: [CommonModule, FormsModule],
  templateUrl: './anonymization.html',
  styleUrl: './anonymization.scss'
})
export class Anonymization {
  private readonly http = inject(HttpClient);
  
  // Form state using Angular signals
  protected readonly userName = signal('');
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly result = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  /**
   * Handle file selection from input
   * Validates file type (CSV or text files)
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['.csv', '.txt'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (allowedTypes.includes(fileExtension)) {
        this.selectedFile.set(file);
        this.error.set(null);
      } else {
        this.error.set('Please select a CSV or text file.');
        this.selectedFile.set(null);
        input.value = '';
      }
    }
  }

  /**
   * Process file content and prepare for anonymization
   */
  private async processFileContent(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          // Parse CSV content
          const lines = content.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          const data: any[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            data.push(row);
          }
          resolve(data);
        } else {
          // For text files, treat each line as data
          const lines = content.split('\n').filter(line => line.trim());
          const data = lines.map((line, index) => ({
            line: index + 1,
            content: line.trim()
          }));
          resolve(data);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Handle anonymization process
   * Validates inputs and calls the API
   */
  async onAnonymize(): Promise<void> {
    // Validate inputs
    if (!this.userName().trim()) {
      this.error.set('Please enter a username.');
      return;
    }

    if (!this.selectedFile()) {
      this.error.set('Please select a file to anonymize.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.result.set(null);

    try {
      // Process file content
      const fileData = await this.processFileContent(this.selectedFile()!);
      
      // Prepare API request
      const requestBody = {
        data: fileData,
        strategy: 'basic', // Default strategy - could be made configurable
        preserveFormat: true,
        seed: Math.floor(Math.random() * 1000000)
      };

      // Call anonymization API
      this.callAnonymizationAPI(requestBody).subscribe({
        next: (response) => {
          this.result.set(JSON.stringify(response, null, 2));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.error.set(`Anonymization failed: ${error.message || 'Unknown error'}`);
          this.isLoading.set(false);
        }
      });

    } catch (error) {
      this.error.set(`File processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.isLoading.set(false);
    }
  }

  /**
   * Call the anonymization API
   */
  private callAnonymizationAPI(data: any): Observable<any> {
    return this.http.post('/api/v1/anonymization/quick-anonymize', data)
      .pipe(
        catchError(error => {
          console.error('API Error:', error);
          return of({ error: 'Failed to anonymize data' });
        })
      );
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.userName.set('');
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
   * Download anonymized result as file
   */
  downloadResult(): void {
    if (!this.result()) return;

    const blob = new Blob([this.result()!], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anonymized_${this.userName()}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
