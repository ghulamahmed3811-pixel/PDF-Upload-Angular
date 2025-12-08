import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PdfData {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadDate: string;
  url: string;
}

export interface PdfUploadResponse {
  message: string;
  data: PdfData;
}

export interface PdfListResponse {
  pdfs: PdfData[];
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api'; // Backend API URL

  /**
   * Upload a PDF file to the backend
   */
  uploadPdf(file: File): Observable<PdfData> {
    const formData = new FormData();
    formData.append('pdf', file);

    return this.http.post<PdfUploadResponse>(`${this.apiUrl}/upload-pdf`, formData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get all PDFs from the backend
   */
  getAllPdfs(): Observable<PdfData[]> {
    return this.http.get<PdfListResponse>(`${this.apiUrl}/pdfs`).pipe(
      map(response => response.pdfs)
    );
  }

  /**
   * Get a single PDF by ID
   */
  getPdfById(id: string): Observable<PdfData> {
    return this.http.get<PdfData>(`${this.apiUrl}/pdfs/${id}`);
  }

  /**
   * Get PDF view URL
   */
  getPdfViewUrl(id: string): string {
    return `${this.apiUrl}/pdfs/${id}/view`;
  }

  /**
   * Delete a PDF by ID
   */
  deletePdf(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.apiUrl}/pdfs/${id}`);
  }

  /**
   * Convert relative URL to absolute URL
   */
  getAbsoluteUrl(relativeUrl: string): string {
    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }
    // Backend URLs like /assets/filename.pdf need to be converted to full URLs
    if (relativeUrl.startsWith('/assets/')) {
      return `http://localhost:3000${relativeUrl}`;
    }
    return relativeUrl;
  }
}

