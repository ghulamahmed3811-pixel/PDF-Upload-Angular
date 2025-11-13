import { Component, ViewChild, ElementRef, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';

interface PdfResource {
  id: number;
  title: string;
  description: string;
  author: string;
  pages: number;
  category: string;
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

  constructor(private router: Router, @Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  activeSection: 'library' | 'recent' | 'about' = 'library';

  ngOnInit(): void {
    // Load uploaded PDFs from storage on component init
    if (this.isBrowser) {
      const stored = localStorage.getItem('uploadedPdfs');
      if (stored) {
        const pdfs = JSON.parse(stored);
        // Add uploaded PDFs to the beginning if they're not already there
        pdfs.forEach((pdf: PdfResource) => {
          if (!this.pdfResources.find(p => p.id === pdf.id)) {
            this.pdfResources.unshift(pdf);
          }
        });
      }
    }

    this.updateSectionFromUrl(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateSectionFromUrl(event.urlAfterRedirects);
      });
  }

  pdfResources: PdfResource[] = [
    {
      id: 1,
      title: 'Angular Best Practices Guide',
      description: 'A comprehensive guide covering the best practices for building scalable Angular applications. Learn about component architecture, state management, and performance optimization.',
      author: 'John Developer',
      pages: 150,
      category: 'Web Development'
    },
    {
      id: 2,
      title: 'TypeScript Advanced Patterns',
      description: 'Deep dive into advanced TypeScript patterns and techniques. Master generics, decorators, and type manipulation for professional development.',
      author: 'Sarah Code',
      pages: 200,
      category: 'Programming'
    },
    {
      id: 3,
      title: 'SCSS Styling Mastery',
      description: 'Learn modern CSS preprocessing with SCSS. Discover mixins, functions, and advanced styling techniques to create beautiful responsive designs.',
      author: 'Mike Styles',
      pages: 120,
      category: 'Design'
    },
    {
      id: 4,
      title: 'Web Performance Optimization',
      description: 'Complete guide to optimizing web applications. Learn about lazy loading, code splitting, caching strategies, and performance monitoring tools.',
      author: 'Emma Performance',
      pages: 180,
      category: 'Web Development'
    },
    {
      id: 5,
      title: 'Modern UI/UX Design Principles',
      description: 'Explore contemporary design principles and user experience patterns. Create intuitive interfaces that users love with proven design methodologies.',
      author: 'David Designer',
      pages: 160,
      category: 'Design'
    },
    {
      id: 6,
      title: 'API Design and Integration',
      description: 'Master RESTful API design, GraphQL, and service integration. Learn authentication, error handling, and building robust backend connections.',
      author: 'Lisa Backend',
      pages: 190,
      category: 'Backend'
    }
  ];

  viewPdf(id: number): void {
    this.router.navigate(['/pdf', id]);
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Format the title: remove .pdf extension and capitalize words
      const rawTitle = file.name.replace('.pdf', '').replace('.PDF', '');
      const formattedTitle = this.formatTitle(rawTitle);
      
      // Create new PDF resource from uploaded file
      const newPdf: PdfResource = {
        id: Date.now(), // Use timestamp for unique ID
        title: formattedTitle,
        description: `Uploaded PDF document. Click to view more details about this document.`,
        author: 'User Upload',
        pages: 0, // We can't determine actual pages from client-side
        category: 'Uploaded'
      };
      
      // Add to the beginning of the array so it appears first
      this.pdfResources.unshift(newPdf);
      
      // Store uploaded PDFs in localStorage for detail page access
      if (this.isBrowser) {
        const uploadedPdfs = this.pdfResources.filter(p => p.category === 'Uploaded');
        localStorage.setItem('uploadedPdfs', JSON.stringify(uploadedPdfs));
      }
      
      // Reset the file input
      input.value = '';
      
      // Optional: Show success message
      console.log('File added to library:', formattedTitle);
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
    this.pdfResources = this.pdfResources.filter(pdf => pdf.id !== id);

    if (this.isBrowser) {
      const uploadedPdfs = this.pdfResources.filter(p => p.category === 'Uploaded');
      localStorage.setItem('uploadedPdfs', JSON.stringify(uploadedPdfs));
    }

    console.log('PDF deleted:', id);
    this.closeDeleteModal();
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

