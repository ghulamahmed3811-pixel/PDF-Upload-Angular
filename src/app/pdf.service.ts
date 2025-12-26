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
  private apiUrl = 'https://pdf-upload-backend-theta.vercel.app/api'; // Backend API URL
  private adminToken: string | null = null; // Store admin session token

  /**
   * Authenticate as admin with the backend
   */
  authenticateAdmin(adminKey: string): Observable<{ success: boolean; sessionToken: string; expiresAt: number }> {
    return this.http.post<{ success: boolean; sessionToken: string; expiresAt: number }>(
      `${this.apiUrl}/admin/auth`,
      { adminKey }
    ).pipe(
      map(response => {
        // Store the session token
        this.adminToken = response.sessionToken;
        // Also store in sessionStorage for persistence
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adminToken', response.sessionToken);
          sessionStorage.setItem('adminTokenExpires', response.expiresAt.toString());
        }
        return response;
      })
    );
  }

  /**
   * Get stored admin token
   */
  getAdminToken(): string | null {
    if (!this.adminToken && typeof window !== 'undefined') {
      // Try to restore from sessionStorage
      const storedToken = sessionStorage.getItem('adminToken');
      const expiresAt = sessionStorage.getItem('adminTokenExpires');
      
      if (storedToken && expiresAt) {
        // Check if token is still valid
        if (Date.now() < parseInt(expiresAt)) {
          this.adminToken = storedToken;
        } else {
          // Token expired, clear it
          sessionStorage.removeItem('adminToken');
          sessionStorage.removeItem('adminTokenExpires');
        }
      }
    }
    return this.adminToken;
  }

  /**
   * Clear admin token
   */
  clearAdminToken(): void {
    this.adminToken = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminTokenExpires');
    }
  }

  /**
   * Upload a PDF file to the backend (requires admin authentication)
   */
  uploadPdf(file: File): Observable<PdfData> {
    const formData = new FormData();
    formData.append('pdf', file);
    
    const token = this.getAdminToken();
    if (!token) {
      throw new Error('Admin authentication required');
    }

    return this.http.post<PdfUploadResponse>(
      `${this.apiUrl}/upload-pdf`,
      formData,
      {
        headers: {
          'X-Admin-Token': token
        }
      }
    ).pipe(
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
   * Delete a PDF by ID (requires admin authentication)
   */
  deletePdf(id: string): Observable<{ message: string; id: string }> {
    const token = this.getAdminToken();
    if (!token) {
      throw new Error('Admin authentication required');
    }

    return this.http.delete<{ message: string; id: string }>(
      `${this.apiUrl}/pdfs/${id}`,
      {
        headers: {
          'X-Admin-Token': token
        }
      }
    );
  }

  /**
   * Convert relative URL to absolute URL
   */
  getAbsoluteUrl(relativeUrl: string): string {
    // If already absolute (starts with http/https), return as-is
    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }
    // Backend proxy URLs like /api/pdfs/:id/view need to be converted to full URLs
    if (relativeUrl.startsWith('/api/')) {
      return `${this.apiUrl}${relativeUrl.replace(/^\/api/, '')}`;
    }
    // Legacy asset URLs (should not be used with Cloudinary, but keep for compatibility)
    if (relativeUrl.startsWith('/assets/')) {
      return `${this.apiUrl}${relativeUrl}`;
    }
    return relativeUrl;
  }
}

