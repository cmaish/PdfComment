import { Comment, CommentPosition, DocumentType } from '../types';

/**
 * Abstract base class for document renderers
 */
export abstract class BaseDocumentRenderer {
  protected container: HTMLElement;
  protected documentContainer: HTMLElement;
  protected scale = 1;

  constructor(container: HTMLElement) {
    this.container = container;
    this.documentContainer = document.createElement('div');
    this.documentContainer.className = 'document-viewer-container';
    this.container.appendChild(this.documentContainer);
  }

  /**
   * Load and render the document
   */
  abstract loadDocument(source: unknown): Promise<void>;

  /**
   * Render the entire document
   */
  abstract renderDocument(): Promise<void>;

  /**
   * Get the document type
   */
  abstract getDocumentType(): DocumentType;

  /**
   * Create comment overlay for interaction
   */
  abstract createCommentOverlay(onCommentCreate: (position: CommentPosition) => void): void;

  /**
   * Render a comment marker at the specified position
   */
  abstract renderCommentMarker(comment: Comment): HTMLElement | null;

  /**
   * Remove a comment marker
   */
  public removeCommentMarker(commentId: string): void {
    const marker = this.documentContainer.querySelector(
      `[data-comment-id="${commentId}"]`
    );
    if (marker) {
      marker.remove();
    }
  }

  /**
   * Zoom in
   */
  public zoomIn(): void {
    this.scale *= 1.2;
    this.renderDocument();
  }

  /**
   * Zoom out
   */
  public zoomOut(): void {
    this.scale /= 1.2;
    this.renderDocument();
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.documentContainer.remove();
  }

  /**
   * Get comment position from click event
   */
  protected abstract getPositionFromEvent(event: MouseEvent, target: HTMLElement): CommentPosition | null;
}
