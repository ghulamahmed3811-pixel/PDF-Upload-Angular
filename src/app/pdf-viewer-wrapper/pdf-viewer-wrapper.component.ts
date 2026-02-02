import { Component, Input, OnInit, Inject, PLATFORM_ID, ViewChild, ViewContainerRef, ComponentRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (pdfSrc && typeof pdfSrc === 'string') {
      @if (isIos) {
        <div class="pdf-ios-fallback">
          <p class="pdf-ios-message">PDFs don't scroll properly in Safari on iPhone. Open the PDF in a new tab for the best experience.</p>
          <a [href]="pdfSrc" target="_blank" rel="noopener noreferrer" class="pdf-open-new-tab">
            Open PDF in New Tab
          </a>
          <p class="pdf-ios-hint">The PDF will open in Safari where you can scroll through all pages.</p>
        </div>
      } @else {
        <div class="pdf-iframe-container">
          <iframe 
            [src]="safePdfUrl" 
            class="pdf-iframe"
            title="PDF Viewer"
            scrolling="yes"
            (load)="onIframeLoad()"
            (error)="onIframeError()">
          </iframe>
        </div>
      }
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
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y pan-x;
      border: none;
      background: white;
    }
    
    .pdf-iframe {
      width: 100%;
      height: 100%;
      min-height: 600px;
      border: none;
      display: block;
    }

    @media (max-width: 768px) {
      .pdf-iframe-container {
        min-height: 400px;
        height: calc(100vh - 280px);
        overflow: auto;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y pan-x;
      }
      
      .pdf-iframe {
        min-height: 400px;
      }
    }

    @media (max-width: 480px) {
      .pdf-iframe-container {
        min-height: 350px;
        height: calc(100vh - 260px);
      }
      
      .pdf-iframe {
        min-height: 350px;
      }
    }

    /* iOS fallback - Safari can't scroll PDFs in iframe */
    .pdf-ios-fallback {
      text-align: center;
      padding: 2rem 1.5rem;
      background: #f8fafc;
      border: 2px dashed #e2e8f0;
      border-radius: 12px;
    }

    .pdf-ios-message {
      margin: 0 0 1rem;
      color: #475569;
      font-size: 0.938rem;
      line-height: 1.5;
    }

    .pdf-open-new-tab {
      display: inline-block;
      padding: 0.875rem 1.75rem;
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      color: white;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .pdf-open-new-tab:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(13, 148, 136, 0.4);
    }

    .pdf-ios-hint {
      margin: 1rem 0 0;
      font-size: 0.813rem;
      color: #94a3b8;
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
  isIos = false;
  useIframe = true;
  private pdfViewerComponentRef: ComponentRef<any> | null = null;
  safePdfUrl: SafeResourceUrl | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private sanitizer: DomSanitizer
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.isIos = this.isBrowser && (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  ngOnInit(): void {
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

