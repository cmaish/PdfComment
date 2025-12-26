import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { Comment, CommentEvent, CommentEventType, PdfCommentOptions } from '../types';
import { EventEmitter } from '../utils/eventEmitter';
import { CommentManager } from './CommentManager';
import { CommentRenderer } from './CommentRenderer';
import { CommentUI } from '../ui/CommentUI';

// Set worker path for PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

/**
 * Main PDF Comment Viewer class
 * Integrates PDF.js with comment functionality
 */
export class PdfCommentViewer {
  private container: HTMLElement;
  private pdfDocument: PDFDocumentProxy | null = null;
  private pages: PDFPageProxy[] = [];
  private commentManager: CommentManager;
  private commentRenderer: CommentRenderer;
  private commentUI: CommentUI;
  private eventEmitter: EventEmitter<CommentEvent>;
  private options: PdfCommentOptions;
  private pdfContainer: HTMLElement;
  private scale = 1.5;

  constructor(options: PdfCommentOptions) {
    this.options = {
      enableCommentCreation: true,
      enableCommentEditing: true,
      enableReplies: true,
      ...options,
    };

    this.container = options.container;
    this.eventEmitter = new EventEmitter<CommentEvent>();
    this.commentManager = new CommentManager(options.initialComments || []);
    this.commentRenderer = new CommentRenderer(this.eventEmitter);
    this.commentUI = new CommentUI(this.commentManager, this.options, this.eventEmitter);

    // Create PDF container
    this.pdfContainer = document.createElement('div');
    this.pdfContainer.className = 'pdf-comment-viewer';
    this.container.appendChild(this.pdfContainer);

    this.setupEventListeners();
    this.init();
  }

  /**
   * Initialize the PDF viewer
   */
  private async init(): Promise<void> {
    try {
      await this.loadPdf();
      await this.renderAllPages();
      this.renderAllComments();
    } catch (error) {
      console.error('Failed to initialize PDF viewer:', error);
      throw error;
    }
  }

  /**
   * Load the PDF document
   */
  private async loadPdf(): Promise<void> {
    const loadingTask = pdfjsLib.getDocument(this.options.pdfSource);
    this.pdfDocument = await loadingTask.promise;

    // Load all pages
    const numPages = this.pdfDocument.numPages;
    for (let i = 1; i <= numPages; i++) {
      const page = await this.pdfDocument.getPage(i);
      this.pages.push(page);
    }
  }

  /**
   * Render all PDF pages
   */
  private async renderAllPages(): Promise<void> {
    this.pdfContainer.innerHTML = '';

    for (let i = 0; i < this.pages.length; i++) {
      const pageContainer = document.createElement('div');
      pageContainer.className = 'pdf-page-container';
      pageContainer.dataset.pageNumber = String(i + 1);
      this.pdfContainer.appendChild(pageContainer);

      await this.renderPage(i, pageContainer);
    }
  }

  /**
   * Render a single PDF page
   */
  private async renderPage(pageIndex: number, container: HTMLElement): Promise<void> {
    const page = this.pages[pageIndex];
    const viewport = page.getViewport({ scale: this.scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.className = 'pdf-canvas';

    container.appendChild(canvas);

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Create comment overlay layer
    const overlayLayer = document.createElement('div');
    overlayLayer.className = 'pdf-comment-overlay';
    overlayLayer.dataset.pageNumber = String(pageIndex);
    overlayLayer.style.width = `${viewport.width}px`;
    overlayLayer.style.height = `${viewport.height}px`;
    container.appendChild(overlayLayer);

    // Enable comment creation on click
    if (this.options.enableCommentCreation) {
      this.setupCommentCreation(overlayLayer, pageIndex);
    }
  }

  /**
   * Setup comment creation on page click
   */
  private setupCommentCreation(overlay: HTMLElement, pageIndex: number): void {
    overlay.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('.pdf-comment-marker')) {
        return; // Don't create new comment when clicking existing marker
      }

      const rect = overlay.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      this.commentUI.showCommentDialog(pageIndex, x, y);
    });
  }

  /**
   * Render all comments on their respective pages
   */
  private renderAllComments(): void {
    const comments = this.commentManager.getAllComments();
    comments.forEach(comment => {
      this.renderComment(comment);
    });
  }

  /**
   * Render a single comment marker on the PDF
   */
  private renderComment(comment: Comment): void {
    if (comment.position.type !== 'pdf') return;

    const position = comment.position as any;
    const overlay = this.pdfContainer.querySelector(
      `.pdf-comment-overlay[data-page-number="${position.page}"]`
    ) as HTMLElement;

    if (!overlay) {
      return;
    }

    this.commentRenderer.renderCommentMarker(overlay, comment);
  }

  /**
   * Setup event listeners for comment events
   */
  private setupEventListeners(): void {
    this.eventEmitter.on(CommentEventType.CREATED, (event) => {
      this.renderComment(event.comment);
      this.options.onCommentCreated?.(event.comment);
    });

    this.eventEmitter.on(CommentEventType.UPDATED, (event) => {
      this.updateCommentMarker(event.comment);
      this.options.onCommentUpdated?.(event.comment);
    });

    this.eventEmitter.on(CommentEventType.DELETED, (event) => {
      this.removeCommentMarker(event.comment.id);
      this.options.onCommentDeleted?.(event.comment.id);
    });

    this.eventEmitter.on(CommentEventType.RESOLVED, (event) => {
      this.updateCommentMarker(event.comment);
      this.options.onCommentResolved?.(event.comment.id, event.comment.resolved);
    });
  }

  /**
   * Update a comment marker's appearance
   */
  private updateCommentMarker(comment: Comment): void {
    const marker = this.pdfContainer.querySelector(
      `[data-comment-id="${comment.id}"]`
    ) as HTMLElement;

    if (marker) {
      marker.className = this.commentRenderer.getMarkerClassName(comment);
    }
  }

  /**
   * Remove a comment marker from the PDF
   */
  private removeCommentMarker(commentId: string): void {
    const marker = this.pdfContainer.querySelector(
      `[data-comment-id="${commentId}"]`
    );

    if (marker) {
      marker.remove();
    }
  }

  /**
   * Add a new comment
   */
  public addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'replies' | 'resolved'>): Comment {
    return this.commentManager.addComment(comment);
  }

  /**
   * Get all comments
   */
  public getComments(): Comment[] {
    return this.commentManager.getAllComments();
  }

  /**
   * Get comments for a specific page
   */
  public getCommentsForPage(page: number): Comment[] {
    return this.commentManager.getCommentsByPage(page);
  }

  /**
   * Update a comment
   */
  public updateComment(commentId: string, updates: Partial<Comment>): Comment | null {
    return this.commentManager.updateComment(commentId, updates);
  }

  /**
   * Delete a comment
   */
  public deleteComment(commentId: string): boolean {
    return this.commentManager.deleteComment(commentId);
  }

  /**
   * Resolve/unresolve a comment
   */
  public toggleResolveComment(commentId: string): Comment | null {
    return this.commentManager.toggleResolve(commentId);
  }

  /**
   * Zoom in
   */
  public zoomIn(): void {
    this.scale *= 1.2;
    this.renderAllPages();
    this.renderAllComments();
  }

  /**
   * Zoom out
   */
  public zoomOut(): void {
    this.scale /= 1.2;
    this.renderAllPages();
    this.renderAllComments();
  }

  /**
   * Go to specific page
   */
  public goToPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.pages.length) {
      return;
    }

    const pageContainer = this.pdfContainer.querySelector(
      `[data-page-number="${pageNumber}"]`
    );

    if (pageContainer) {
      pageContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Destroy the viewer and clean up resources
   */
  public destroy(): void {
    this.eventEmitter.clear();
    this.commentUI.destroy();
    this.pdfContainer.remove();
    this.pdfDocument?.destroy();
  }
}
