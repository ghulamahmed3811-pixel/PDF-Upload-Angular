import { Component, ViewChild, ElementRef, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter, finalize } from 'rxjs/operators';
import { PdfService, PdfData } from '../pdf.service';

interface PdfResource {
  id: string;
  title: string;
  description: string;
  author: string;
  pages: number;
  category: string;
  fileSize?: number;
  uploadDate?: string;
  url?: string;
}

@Component({
  selector: 'app-pdf-library',
  imports: [CommonModule, RouterModule],
  templateUrl: './pdf-library.component.html',
  styleUrl: './pdf-library.component.scss'
})
export class PdfLibraryComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private isBrowser = false;

  isDeleteModalOpen = false;
  pendingDelete: PdfResource | null = null;
  isLoading = false;
  isUploading = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private pdfService: PdfService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  activeSection: 'library' | 'recent' | 'about' = 'library';
  pdfResources: PdfResource[] = []; // Initialize as empty array, will be populated by loadPdfs()

  ngOnInit(): void {
    this.loadPdfs();
    this.updateSectionFromUrl(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateSectionFromUrl(event.urlAfterRedirects);
        // Reload PDFs when navigating back to library (from detail page or other routes)
        const url = event.urlAfterRedirects.split('?')[0]; // Remove query params
        if (url === '/' || url === '/recent' || url === '/about') {
          console.log('Navigating to library route, reloading PDFs...');
          this.loadPdfs();
        }
      });
  }

  loadPdfs(): void {
    // Don't set isLoading if we're already uploading (to avoid showing both messages)
    if (!this.isUploading) {
      this.isLoading = true;
    }
    this.error = null;
    
    this.pdfService.getAllPdfs().subscribe({
      next: (pdfs: PdfData[]) => {
        console.log('PDFs loaded from backend:', pdfs.length);
        
        // Convert backend PDF data to PdfResource format
        const backendPdfs: PdfResource[] = pdfs.map(pdf => ({
          id: pdf.id,
          title: this.formatTitle(pdf.originalName.replace(/\.pdf$/i, '')),
          description: `Uploaded PDF document. File size: ${this.formatFileSize(pdf.fileSize)}`,
          author: 'User Upload',
          pages: 0,
          category: 'Uploaded',
          fileSize: pdf.fileSize,
          uploadDate: pdf.uploadDate,
          url: this.pdfService.getAbsoluteUrl(pdf.url)
        }));

        // Get sample PDFs (hardcoded ones)
        const samplePdfs: PdfResource[] = [
          {
            id: '1',
            title: 'Angular Best Practices Guide',
            description: 'A comprehensive guide covering the best practices for building scalable Angular applications. Learn about component architecture, state management, and performance optimization.',
            author: 'John Developer',
            pages: 150,
            category: 'Web Development'
          },
          {
            id: '2',
            title: 'TypeScript Advanced Patterns',
            description: 'Deep dive into advanced TypeScript patterns and techniques. Master generics, decorators, and type manipulation for professional development.',
            author: 'Sarah Code',
            pages: 200,
            category: 'Programming'
          },
          {
            id: '3',
            title: 'SCSS Styling Mastery',
            description: 'Learn modern CSS preprocessing with SCSS. Discover mixins, functions, and advanced styling techniques to create beautiful responsive designs.',
            author: 'Mike Styles',
            pages: 120,
            category: 'Design'
          },
          {
            id: '4',
            title: 'Web Performance Optimization',
            description: 'Complete guide to optimizing web applications. Learn about lazy loading, code splitting, caching strategies, and performance monitoring tools.',
            author: 'Emma Performance',
            pages: 180,
            category: 'Web Development'
          },
          {
            id: '5',
            title: 'Modern UI/UX Design Principles',
            description: 'Explore contemporary design principles and user experience patterns. Create intuitive interfaces that users love with proven design methodologies.',
            author: 'David Designer',
            pages: 160,
            category: 'Design'
          },
          {
            id: '6',
            title: 'API Design and Integration',
            description: 'Master RESTful API design, GraphQL, and service integration. Learn authentication, error handling, and building robust backend connections.',
            author: 'Lisa Backend',
            pages: 190,
            category: 'Backend'
          }
        ];
        
        // Combine backend PDFs with sample PDFs (backend PDFs first)
        // Preserve any PDFs that were added immediately but might not be in backend response yet
        const existingUploadedIds = new Set(backendPdfs.map(p => p.id));
        const existingPdfs = this.pdfResources.filter(p => 
          p.category === 'Uploaded' && !existingUploadedIds.has(p.id)
        );
        
        // Combine: existing immediate uploads + backend PDFs + sample PDFs
        const allPdfs = [...existingPdfs, ...backendPdfs, ...samplePdfs];
        // Remove duplicates by ID
        const uniquePdfs = allPdfs.filter((pdf, index, self) => 
          index === self.findIndex(p => p.id === pdf.id)
        );
        this.pdfResources = uniquePdfs;
        this.isLoading = false;
        this.cdr.detectChanges(); // Force UI update
        console.log('Total PDFs displayed:', this.pdfResources.length);
      },
      error: (err) => {
        console.error('Error loading PDFs:', err);
        this.error = 'Failed to load PDFs. Please check if the backend server is running.';
        this.isLoading = false;
        this.cdr.detectChanges(); // Force UI update
        
        // Preserve any uploaded PDFs that were added immediately
        const existingUploadedPdfs = this.pdfResources.filter(p => p.category === 'Uploaded');
        
        // Still show sample PDFs even if backend fails
        const samplePdfs: PdfResource[] = [
          {
            id: '1',
            title: 'Angular Best Practices Guide',
            description: 'A comprehensive guide covering the best practices for building scalable Angular applications. Learn about component architecture, state management, and performance optimization.',
            author: 'John Developer',
            pages: 150,
            category: 'Web Development'
          },
          {
            id: '2',
            title: 'TypeScript Advanced Patterns',
            description: 'Deep dive into advanced TypeScript patterns and techniques. Master generics, decorators, and type manipulation for professional development.',
            author: 'Sarah Code',
            pages: 200,
            category: 'Programming'
          },
          {
            id: '3',
            title: 'SCSS Styling Mastery',
            description: 'Learn modern CSS preprocessing with SCSS. Discover mixins, functions, and advanced styling techniques to create beautiful responsive designs.',
            author: 'Mike Styles',
            pages: 120,
            category: 'Design'
          },
          {
            id: '4',
            title: 'Web Performance Optimization',
            description: 'Complete guide to optimizing web applications. Learn about lazy loading, code splitting, caching strategies, and performance monitoring tools.',
            author: 'Emma Performance',
            pages: 180,
            category: 'Web Development'
          },
          {
            id: '5',
            title: 'Modern UI/UX Design Principles',
            description: 'Explore contemporary design principles and user experience patterns. Create intuitive interfaces that users love with proven design methodologies.',
            author: 'David Designer',
            pages: 160,
            category: 'Design'
          },
          {
            id: '6',
            title: 'API Design and Integration',
            description: 'Master RESTful API design, GraphQL, and service integration. Learn authentication, error handling, and building robust backend connections.',
            author: 'Lisa Backend',
            pages: 190,
            category: 'Backend'
          }
        ];
        
        // Combine existing uploaded PDFs with sample PDFs
        this.pdfResources = [...existingUploadedPdfs, ...samplePdfs];
      }
    });
  }

  viewPdf(id: string): void {
    this.router.navigate(['/pdf', id]);
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        this.error = 'Only PDF files are allowed!';
        input.value = '';
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        this.error = 'File size exceeds 10MB limit!';
        input.value = '';
        return;
      }

      this.isUploading = true;
      this.error = null;

      // Upload to backend
      this.pdfService.uploadPdf(file).subscribe({
        next: (pdfData: PdfData) => {
          console.log('Upload success response:', pdfData);
          
          // Clear any previous errors
          this.error = null;
          
          // Format the title: remove .pdf extension and capitalize words
          const rawTitle = pdfData.originalName.replace(/\.pdf$/i, '');
          const formattedTitle = this.formatTitle(rawTitle);
          
          // Create new PDF resource from uploaded file
          const newPdf: PdfResource = {
            id: pdfData.id,
            title: formattedTitle,
            description: `Uploaded PDF document. File size: ${this.formatFileSize(pdfData.fileSize)}`,
            author: 'User Upload',
            pages: 0,
            category: 'Uploaded',
            fileSize: pdfData.fileSize,
            uploadDate: pdfData.uploadDate,
            url: this.pdfService.getAbsoluteUrl(pdfData.url)
          };
          
          // IMPORTANT: Set uploading to false FIRST, before adding to array
          // This ensures the UI updates immediately
          this.isUploading = false;
          
          // Add to the beginning of the array immediately for instant UI update
          // Check if it already exists (avoid duplicates)
          const exists = this.pdfResources.some(p => p.id === pdfData.id);
          if (!exists) {
            this.pdfResources = [newPdf, ...this.pdfResources];
            console.log('PDF added to UI immediately. Total PDFs:', this.pdfResources.length);
            
            // Force change detection to update UI immediately
            this.cdr.detectChanges();
          }
          
          // Reset file input
          input.value = '';
          
          // Optionally reload from backend after a short delay to ensure consistency
          // But don't show loading state since we already have the PDF displayed
          setTimeout(() => {
            this.pdfService.getAllPdfs().subscribe({
              next: (pdfs: PdfData[]) => {
                // Update the array with fresh data from backend, but keep the order
                const backendPdfs: PdfResource[] = pdfs.map(pdf => ({
                  id: pdf.id,
                  title: this.formatTitle(pdf.originalName.replace(/\.pdf$/i, '')),
                  description: `Uploaded PDF document. File size: ${this.formatFileSize(pdf.fileSize)}`,
                  author: 'User Upload',
                  pages: 0,
                  category: 'Uploaded',
                  fileSize: pdf.fileSize,
                  uploadDate: pdf.uploadDate,
                  url: this.pdfService.getAbsoluteUrl(pdf.url)
                }));
                
                // Get sample PDFs
                const samplePdfs = this.pdfResources.filter(p => p.category !== 'Uploaded');
                
                // Combine: backend PDFs + sample PDFs
                const allPdfs = [...backendPdfs, ...samplePdfs];
                const uniquePdfs = allPdfs.filter((pdf, index, self) => 
                  index === self.findIndex(p => p.id === pdf.id)
                );
                this.pdfResources = uniquePdfs;
                this.cdr.detectChanges();
                console.log('PDFs synced with backend. Total:', this.pdfResources.length);
              },
              error: (err) => {
                console.error('Error syncing PDFs:', err);
                // Don't show error to user, we already have the PDF displayed
              }
            });
          }, 1000); // Wait 1 second before syncing
          
          console.log('File uploaded successfully:', pdfData.originalName);
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.error = err.error?.error || err.error?.details || 'Failed to upload PDF. Please try again.';
          this.isUploading = false;
          input.value = '';
          this.cdr.detectChanges();
        },
        complete: () => {
          // Ensure uploading flag is false when complete
          this.isUploading = false;
          input.value = '';
          this.cdr.detectChanges();
          console.log('Upload process completed');
        }
      });
    }
  }

  get recentUploads(): PdfResource[] {
    return this.pdfResources.filter(pdf => pdf.category === 'Uploaded');
  }

  get filteredPdfs(): PdfResource[] {
    if (this.activeSection === 'recent') {
      return this.recentUploads;
    }

    if (this.activeSection === 'about') {
      return [];
    }

    return this.pdfResources;
  }

  formatTitle(title: string): string {
    // Replace underscores and hyphens with spaces
    let formatted = title.replace(/[_-]/g, ' ');
    
    // Capitalize first letter of each word
    formatted = formatted.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return formatted;
  }

  openDeleteModal(pdf: PdfResource, event: Event): void {
    event.stopPropagation();
    this.pendingDelete = pdf;
    this.isDeleteModalOpen = true;
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }
  }

  closeDeleteModal(): void {
    if (this.isBrowser) {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    this.isDeleteModalOpen = false;
    this.pendingDelete = null;
  }

  confirmDelete(): void {
    if (!this.pendingDelete) {
      return;
    }

    const id = this.pendingDelete.id;
    const pdfToDelete = this.pendingDelete;
    
    // Remove from UI immediately for instant feedback
    this.pdfResources = this.pdfResources.filter(pdf => pdf.id !== id);
    
    // Close modal immediately for better UX
    this.closeDeleteModal();
    
    // Only delete from backend if it's an uploaded PDF (not a sample PDF)
    if (pdfToDelete.category === 'Uploaded') {
      this.pdfService.deletePdf(id).subscribe({
        next: () => {
          console.log('PDF deleted successfully from backend:', id);
          // PDF already removed from UI above
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.error = err.error?.error || err.error?.details || 'Failed to delete PDF. Please try again.';
          // Re-add to UI if deletion failed
          this.pdfResources = [pdfToDelete, ...this.pdfResources];
        }
      });
    } else {
      // For sample PDFs, already removed from UI above
      console.log('Sample PDF removed:', id);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  private updateSectionFromUrl(url: string): void {
    if (url.includes('/recent')) {
      this.activeSection = 'recent';
    } else if (url.includes('/about')) {
      this.activeSection = 'about';
    } else {
      this.activeSection = 'library';
    }
  }
}

