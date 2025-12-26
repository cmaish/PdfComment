import { BaseDocumentRenderer } from './BaseDocumentRenderer';
import { Comment, CommentPosition, DocumentType, WordPosition } from '../types';

/**
 * Renders Word documents (DOCX)
 * Note: This is a simplified renderer. For production, consider using libraries like mammoth.js
 */
export class WordDocumentRenderer extends BaseDocumentRenderer {
  private pages: HTMLElement[] = [];

  public getDocumentType(): DocumentType {
    return DocumentType.WORD;
  }

  public async loadDocument(source: string | ArrayBuffer | File): Promise<void> {
    let _documentData: ArrayBuffer;

    if (typeof source === 'string') {
      const response = await fetch(source);
      _documentData = await response.arrayBuffer();
    } else if (source instanceof File) {
      _documentData = await source.arrayBuffer();
    } else {
      _documentData = source;
    }

    // In a real implementation, you would parse the DOCX file here using _documentData
    // For now, we'll create a placeholder implementation
    await this.parseDocument();
  }

  private async parseDocument(): Promise<void> {
    // Placeholder: In production, use mammoth.js or docx library to parse
    // For now, create a simple placeholder page
    const placeholderPage = document.createElement('div');
    placeholderPage.innerHTML = `
      <div style="padding: 40px; line-height: 1.6;">
        <h1>Document Content</h1>
        <p>This is a placeholder for Word document content.</p>
        <p>In a production environment, integrate with libraries like:</p>
        <ul>
          <li><strong>mammoth.js</strong> - Converts DOCX to HTML</li>
          <li><strong>docx</strong> - Parse and manipulate DOCX files</li>
        </ul>
        <p>The comment system works the same way - click anywhere to add a comment!</p>
      </div>
    `;
    this.pages.push(placeholderPage);
  }

  public async renderDocument(): Promise<void> {
    this.documentContainer.innerHTML = '';
    this.documentContainer.className = 'word-document-viewer';

    this.pages.forEach((pageContent, index) => {
      const pageContainer = document.createElement('div');
      pageContainer.className = 'word-page-container';
      pageContainer.dataset.pageNumber = String(index);
      pageContainer.style.transform = `scale(${this.scale})`;
      pageContainer.style.transformOrigin = 'top center';

      const page = document.createElement('div');
      page.className = 'word-page';
      page.appendChild(pageContent.cloneNode(true));

      const overlay = document.createElement('div');
      overlay.className = 'word-page-overlay';
      overlay.dataset.pageNumber = String(index);

      pageContainer.appendChild(page);
      pageContainer.appendChild(overlay);
      this.documentContainer.appendChild(pageContainer);
    });
  }

  public createCommentOverlay(onCommentCreate: (position: CommentPosition) => void): void {
    this.documentContainer.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const overlay = target.closest('.word-page-overlay') as HTMLElement;

      if (!overlay) return;

      const pageNumber = parseInt(overlay.dataset.pageNumber || '0', 10);
      const rect = overlay.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      const position: WordPosition = {
        type: DocumentType.WORD,
        page: pageNumber,
        x,
        y,
      };

      onCommentCreate(position);
    });
  }

  public renderCommentMarker(comment: Comment): HTMLElement | null {
    if (comment.position.type !== DocumentType.WORD) return null;

    const position = comment.position as WordPosition;
    const overlay = this.documentContainer.querySelector(
      `.word-page-overlay[data-page-number="${position.page}"]`
    ) as HTMLElement;

    if (!overlay) return null;

    const marker = document.createElement('div');
    marker.className = `comment-marker comment-marker--word ${
      comment.resolved ? 'comment-marker--resolved' : ''
    }`;
    marker.dataset.commentId = comment.id;
    marker.style.left = `${position.x * 100}%`;
    marker.style.top = `${position.y * 100}%`;
    marker.innerHTML = '<span class="comment-marker-icon">💬</span>';

    overlay.appendChild(marker);

    return marker;
  }

  protected getPositionFromEvent(event: MouseEvent, target: HTMLElement): CommentPosition | null {
    const overlay = target.closest('.word-page-overlay') as HTMLElement;
    if (!overlay) return null;

    const pageNumber = parseInt(overlay.dataset.pageNumber || '0', 10);
    const rect = overlay.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    return {
      type: DocumentType.WORD,
      page: pageNumber,
      x,
      y,
    };
  }

  /**
   * Navigate to a specific page
   */
  public goToPage(page: number): void {
    const pageContainer = this.documentContainer.querySelector(
      `.word-page-container[data-page-number="${page}"]`
    );

    if (pageContainer) {
      pageContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
