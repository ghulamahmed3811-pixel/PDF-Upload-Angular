import { Component, Input, OnInit, Inject, PLATFORM_ID, ViewChild, ViewContainerRef, ComponentRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (pdfSrc && typeof pdfSrc === 'string') {
      <div class="pdf-iframe-container">
        <iframe 
          [src]="safePdfUrl" 
          class="pdf-iframe"
          title="PDF Viewer"
          (load)="onIframeLoad()"
          (error)="onIframeError()">
        </iframe>
      </div>
    } @else {
      <div style="text-align: center; padding: 3rem; color: #666;">
        <p>No PDF source available</p>
      </div>
    }
  `,
  styles: [`
    .pdf-iframe-container {
      width: 100%;
      height: calc(100vh - 300px);
      min-height: 600px;
      overflow: hidden;
      border: none;
      background: white;
    }
    
    .pdf-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
  `]
})
export class PdfViewerWrapperComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() pdfSrc: string | Uint8Array | undefined = undefined;
  @Input() page: number = 1;
  @Input() totalPages: number = 0;
  @Input() isPdfLoading: boolean = false;
  @Input() pdfError: string | null = null;
  @Input() onLoadComplete: ((pdf: any) => void) | null = null;
  @Input() onLoadStart: (() => void) | null = null;
  @Input() onError: ((error: any) => void) | null = null;

  @ViewChild('pdfViewerContainer', { read: ViewContainerRef }) pdfViewerContainer!: ViewContainerRef;

  isBrowser = false;
  useIframe = true; // Use iframe by default to avoid SSR issues
  private pdfViewerComponentRef: ComponentRef<any> | null = null;
  safePdfUrl: SafeResourceUrl | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private sanitizer: DomSanitizer
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Use iframe for now to avoid SSR issues with ng2-pdf-viewer
    // Can be changed to false to use ng2-pdf-viewer if needed (but requires SSR exclusion)
    this.useIframe = true;
    this.updateSafeUrl();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pdfSrc'] || changes['page']) {
      this.updateSafeUrl();
    }
  }

  private updateSafeUrl(): void {
    if (this.pdfSrc && typeof this.pdfSrc === 'string') {
      const url = this.getIframeSrc();
      this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } else {
      this.safePdfUrl = null;
    }
  }

  async ngAfterViewInit(): Promise<void> {
    // Only try to load PDF viewer if not using iframe and in browser
    if (this.isBrowser && !this.useIframe && this.pdfSrc && this.pdfViewerContainer) {
      await this.loadPdfViewer();
    }
  }

  ngOnDestroy(): void {
    if (this.pdfViewerComponentRef) {
      this.pdfViewerComponentRef.destroy();
    }
  }

  private async loadPdfViewer(): Promise<void> {
    if (!this.isBrowser || !this.pdfViewerContainer) {
      return;
    }

    try {
      // Dynamically import PdfViewerModule only in browser
      const { PdfViewerModule } = await import('ng2-pdf-viewer');
      
      // Configure PDF.js worker
      if (typeof window !== 'undefined') {
        (window as any).pdfWorkerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      // Note: Dynamic component creation would require more complex setup
      // For now, using iframe is simpler and avoids SSR issues
    } catch (error) {
      console.error('Failed to load PDF viewer:', error);
      this.useIframe = true; // Fallback to iframe on error
    }
  }

  getIframeSrc(): string {
    if (!this.pdfSrc || typeof this.pdfSrc !== 'string') {
      return '';
    }
    // Add parameters to hide toolbar and navigation panes
    // toolbar=0 hides toolbar, navpanes=0 hides navigation panes
    const baseUrl = this.pdfSrc.split('#')[0]; // Remove existing hash
    const params = [];
    
    // Add page parameter if page > 1
    if (this.page > 1) {
      params.push(`page=${this.page}`);
    }
    
    // Hide toolbar and navigation panes
    params.push('toolbar=0');
    params.push('navpanes=0');
    
    const hash = params.length > 0 ? `#${params.join('&')}` : '';
    return `${baseUrl}${hash}`;
  }

  onIframeLoad(): void {
    console.log('PDF iframe loaded successfully, URL:', this.pdfSrc);
    if (this.onLoadStart) {
      this.onLoadStart();
    }
    // Simulate load complete for iframe
    setTimeout(() => {
      if (this.onLoadComplete) {
        this.onLoadComplete({ numPages: 1 }); // Iframe doesn't provide page count
      }
    }, 100);
  }

  onIframeError(): void {
    console.error('PDF iframe failed to load, URL:', this.pdfSrc);
    if (this.onError) {
      this.onError(new Error('Failed to load PDF in iframe'));
    }
  }
}

