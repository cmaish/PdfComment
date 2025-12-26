import {
  Comment,
  CommentEvent,
  CommentEventType,
  BaseDocumentOptions,
  DocumentType,
  CommentPosition,
} from '../types';
import { EventEmitter } from '../utils/eventEmitter';
import { CommentManager } from './CommentManager';
import { CommentUI } from '../ui/CommentUI';
import { BaseDocumentRenderer } from '../renderers/BaseDocumentRenderer';
import { TextDocumentRenderer } from '../renderers/TextDocumentRenderer';
import { WordDocumentRenderer } from '../renderers/WordDocumentRenderer';
import { ExcelDocumentRenderer } from '../renderers/ExcelDocumentRenderer';

/**
 * Unified document viewer that supports multiple document types
 */
export class DocumentCommentViewer {
  private container: HTMLElement;
  private renderer: BaseDocumentRenderer;
  private commentManager: CommentManager;
  private commentUI: CommentUI;
  private eventEmitter: EventEmitter<CommentEvent>;
  private options: BaseDocumentOptions;

  constructor(options: BaseDocumentOptions) {
    this.options = {
      enableCommentCreation: true,
      enableCommentEditing: true,
      enableReplies: true,
      ...options,
    };

    this.container = options.container;
    this.eventEmitter = new EventEmitter<CommentEvent>();
    this.commentManager = new CommentManager(options.initialComments || []);

    // Create the appropriate renderer based on document type
    this.renderer = this.createRenderer(options.document.type);

    // Create UI with backward-compatible options format
    const uiOptions = {
      container: this.container,
      pdfSource: '', // Not used for non-PDF documents
      ...this.options,
    };
    this.commentUI = new CommentUI(this.commentManager, uiOptions, this.eventEmitter);

    this.setupEventListeners();
    this.init();
  }

  /**
   * Create the appropriate renderer for the document type
   */
  private createRenderer(type: DocumentType): BaseDocumentRenderer {
    const viewerContainer = document.createElement('div');
    viewerContainer.className = 'document-comment-viewer';
    this.container.appendChild(viewerContainer);

    switch (type) {
      case DocumentType.TEXT:
        return new TextDocumentRenderer(viewerContainer);
      case DocumentType.WORD:
        return new WordDocumentRenderer(viewerContainer);
      case DocumentType.EXCEL:
        return new ExcelDocumentRenderer(viewerContainer);
      case DocumentType.PDF:
        throw new Error('PDF documents should use PdfCommentViewer');
      default:
        throw new Error(`Unsupported document type: ${type}`);
    }
  }

  /**
   * Initialize the viewer
   */
  private async init(): Promise<void> {
    try {
      await this.renderer.loadDocument(this.options.document.source);
      await this.renderer.renderDocument();
      this.setupCommentCreation();
      this.renderAllComments();
    } catch (error) {
      console.error('Failed to initialize document viewer:', error);
      throw error;
    }
  }

  /**
   * Setup comment creation interaction
   */
  private setupCommentCreation(): void {
    if (!this.options.enableCommentCreation) return;

    this.renderer.createCommentOverlay((position: CommentPosition) => {
      this.showCommentDialog(position);
    });
  }

  /**
   * Show dialog to create a comment
   */
  private showCommentDialog(position: CommentPosition): void {
    // Create a temporary method that matches the expected signature
    const { type, ...positionData } = position;

    // For text documents, use line as page
    let page = 0;
    let x = 0.5;
    let y = 0.5;

    if (type === DocumentType.TEXT) {
      page = (position as any).line - 1;
    } else if (type === DocumentType.WORD) {
      page = (position as any).page;
      x = (position as any).x;
      y = (position as any).y;
    } else if (type === DocumentType.EXCEL) {
      page = (position as any).row - 1;
    }

    // Show the comment dialog using the UI
    this.commentUI.showCommentDialog(page, x, y);

    // Override the created comment's position with the actual position
    const originalOn = this.commentManager.on.bind(this.commentManager);
    this.commentManager.on = ((event: CommentEventType, callback: (e: CommentEvent) => void) => {
      if (event === CommentEventType.CREATED) {
        const wrappedCallback = (e: CommentEvent) => {
          e.comment.position = position;
          callback(e);
        };
        return originalOn(event, wrappedCallback);
      }
      return originalOn(event, callback);
    }) as any;
  }

  /**
   * Render all comments
   */
  private renderAllComments(): void {
    const comments = this.commentManager.getAllComments();
    comments.forEach(comment => {
      this.renderComment(comment);
    });
  }

  /**
   * Render a single comment
   */
  private renderComment(comment: Comment): void {
    this.renderer.renderCommentMarker(comment);
  }

  /**
   * Setup event listeners
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
      this.renderer.removeCommentMarker(event.comment.id);
      this.options.onCommentDeleted?.(event.comment.id);
    });

    this.eventEmitter.on(CommentEventType.RESOLVED, (event) => {
      this.updateCommentMarker(event.comment);
      this.options.onCommentResolved?.(event.comment.id, event.comment.resolved);
    });

    // Forward comment manager events to the main event emitter
    this.commentManager.on(CommentEventType.CREATED, (event) => {
      this.eventEmitter.emit(CommentEventType.CREATED, event);
    });

    this.commentManager.on(CommentEventType.UPDATED, (event) => {
      this.eventEmitter.emit(CommentEventType.UPDATED, event);
    });

    this.commentManager.on(CommentEventType.DELETED, (event) => {
      this.eventEmitter.emit(CommentEventType.DELETED, event);
    });

    this.commentManager.on(CommentEventType.RESOLVED, (event) => {
      this.eventEmitter.emit(CommentEventType.RESOLVED, event);
    });
  }

  /**
   * Update a comment marker
   */
  private updateCommentMarker(comment: Comment): void {
    this.renderer.removeCommentMarker(comment.id);
    this.renderComment(comment);
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
   * Toggle comment resolved status
   */
  public toggleResolveComment(commentId: string): Comment | null {
    return this.commentManager.toggleResolve(commentId);
  }

  /**
   * Zoom in
   */
  public zoomIn(): void {
    this.renderer.zoomIn();
    this.renderAllComments();
  }

  /**
   * Zoom out
   */
  public zoomOut(): void {
    this.renderer.zoomOut();
    this.renderAllComments();
  }

  /**
   * Navigate to a comment's location
   */
  public goToComment(commentId: string): void {
    const comment = this.commentManager.getComment(commentId);
    if (!comment) return;

    const position = comment.position;

    if (position.type === DocumentType.TEXT) {
      (this.renderer as TextDocumentRenderer).goToLine((position as any).line);
    } else if (position.type === DocumentType.WORD) {
      (this.renderer as WordDocumentRenderer).goToPage((position as any).page);
    } else if (position.type === DocumentType.EXCEL) {
      (this.renderer as ExcelDocumentRenderer).goToCell(
        (position as any).row,
        (position as any).column
      );
    }
  }

  /**
   * Get the document type
   */
  public getDocumentType(): DocumentType {
    return this.renderer.getDocumentType();
  }

  /**
   * Destroy the viewer and clean up
   */
  public destroy(): void {
    this.eventEmitter.clear();
    this.commentUI.destroy();
    this.renderer.destroy();
  }
}
