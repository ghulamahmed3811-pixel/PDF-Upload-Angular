import { Component, ViewChild, ElementRef, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter, finalize } from 'rxjs/operators';
import { PdfService, PdfData } from '../pdf.service';
import { AdminService } from '../admin.service';

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


  activeSection: 'library' | 'recent' | 'about' = 'library';
  pdfResources: PdfResource[] = []; // Initialize as empty array, will be populated by loadPdfs()
  isAdmin = false; // Admin status

  constructor(
    private router: Router,
    private pdfService: PdfService,
    private cdr: ChangeDetectorRef,
    private adminService: AdminService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Subscribe to admin status changes first
    this.adminService.isAdmin$.subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      this.cdr.detectChanges();
      console.log('Admin status changed via subscription:', isAdmin);
    });

    // Check admin status from URL - set admin status if on /admin route
    this.checkAdminAccess();

    this.loadPdfs();
    this.updateSectionFromUrl(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        console.log('Navigation event, URL:', event.urlAfterRedirects);
        this.checkAdminAccess(); // Re-check admin access on navigation
        this.updateSectionFromUrl(event.urlAfterRedirects);
        // Reload PDFs when navigating back to library (from detail page or other routes)
        const url = event.urlAfterRedirects.split('?')[0]; // Remove query params
        if (url === '/' || url === '/recent' || url === '/about' || url === '/admin') {
          console.log('Navigating to library route, reloading PDFs...');
          this.loadPdfs();
        }
      });
  }

  /**
   * Check if current URL contains admin key and set admin status
   * Admin buttons should ONLY be visible when on /admin route
   * When navigating away from /admin, admin buttons should disappear
   */
  private checkAdminAccess(): void {
    const currentUrl = this.router.url;
    console.log('Checking admin access for URL:', currentUrl);
    
    // If on /admin route, authenticate with backend and set admin status
    if (currentUrl === '/admin' || currentUrl.startsWith('/admin')) {
      console.log('Admin route detected, authenticating with backend...');
      
      // Call backend to authenticate admin
      this.pdfService.authenticateAdmin('admin').subscribe({
        next: (response) => {
          console.log('✅ Backend admin authentication successful');
          this.adminService.setAdminStatus('admin');
          // Store flag that we're on admin route (for navigation from PDF detail)
          if (this.isBrowser) {
            sessionStorage.setItem('onAdminRoute', 'true');
          }
        },
        error: (err) => {
          console.error('❌ Backend admin authentication failed:', err);
          // Clear admin status on authentication failure
          this.adminService.clearAdminStatus();
          this.pdfService.clearAdminToken();
          this.error = 'Admin authentication failed. Please check your admin key.';
        }
      });
      return;
    }
    
    // For all other routes, clear admin status (hide admin buttons)
    // This ensures admin buttons only appear when on /admin route
    const currentStatus = this.adminService.getIsAdmin();
    if (currentStatus) {
      console.log('Not on admin route, clearing admin status...');
      this.adminService.clearAdminStatus();
      // Clear admin token from backend session
      this.pdfService.clearAdminToken();
    }
    
    // Clear the admin route flag
    if (this.isBrowser) {
      sessionStorage.removeItem('onAdminRoute');
    }
    
    const adminStatus = this.adminService.getIsAdmin();
    console.log('Current route:', currentUrl, '- Final admin status:', adminStatus);
    
    // Ensure local state matches (subscription should handle this automatically)
    if (this.isAdmin !== adminStatus) {
      this.isAdmin = adminStatus;
      this.cdr.detectChanges();
    }
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
    // If on /admin route, preserve it when navigating to PDF detail
    const currentUrl = this.router.url;
    if (currentUrl === '/admin' || currentUrl.startsWith('/admin')) {
      // Set flag so PDF detail knows to navigate back to /admin
      if (this.isBrowser) {
        sessionStorage.setItem('fromAdmin', 'true');
      }
    }
    this.router.navigate(['/pdf', id]);
  }

  /**
   * Get the home route - preserve /admin if currently on admin route
   */
  getHomeRoute(): string {
    const currentUrl = this.router.url;
    if (currentUrl === '/admin' || currentUrl.startsWith('/admin')) {
      return '/admin';
    }
    return '/';
  }

  /**
   * Get the recent route - preserve /admin if currently on admin route
   */
  getRecentRoute(): string {
    const currentUrl = this.router.url;
    if (currentUrl === '/admin' || currentUrl.startsWith('/admin')) {
      return '/admin';
    }
    return '/recent';
  }

  /**
   * Get the about route - preserve /admin if currently on admin route
   */
  getAboutRoute(): string {
    const currentUrl = this.router.url;
    if (currentUrl === '/admin' || currentUrl.startsWith('/admin')) {
      return '/admin';
    }
    return '/about';
  }

  /**
   * Navigate to home, preserving admin route if applicable
   */
  navigateHome(event: Event): void {
    event.preventDefault();
    const route = this.getHomeRoute();
    this.router.navigate([route]);
  }

  /**
   * Navigate to a section, preserving admin route if applicable
   */
  navigateToSection(section: 'recent' | 'about', event: Event): void {
    event.preventDefault();
    const currentUrl = this.router.url;
    if (currentUrl === '/admin' || currentUrl.startsWith('/admin')) {
      // Stay on /admin route, just update the section
      this.updateSectionFromUrl('/admin');
      this.activeSection = section;
      this.cdr.detectChanges();
    } else {
      // Navigate to the section route
      const route = section === 'recent' ? '/recent' : '/about';
      this.router.navigate([route]);
    }
  }

  triggerFileInput(): void {
    // Check admin access before allowing upload
    if (!this.isAdmin) {
      this.error = 'You do not have permission to upload PDFs. Admin access required.';
      return;
    }
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    // Check admin access before processing upload
    if (!this.isAdmin) {
      this.error = 'You do not have permission to upload PDFs. Admin access required.';
      const input = event.target as HTMLInputElement;
      input.value = '';
      return;
    }

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
    // Check admin access before allowing delete
    if (!this.isAdmin) {
      this.error = 'You do not have permission to delete PDFs. Admin access required.';
      return;
    }
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
    // Check admin access before allowing delete
    if (!this.isAdmin) {
      this.error = 'You do not have permission to delete PDFs. Admin access required.';
      this.closeDeleteModal();
      return;
    }

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

