import { BaseDocumentRenderer } from './BaseDocumentRenderer';
import { Comment, CommentPosition, DocumentType, TextPosition } from '../types';

/**
 * Renders text files with line numbers and syntax highlighting
 */
export class TextDocumentRenderer extends BaseDocumentRenderer {
  private content = '';
  private lines: string[] = [];

  public getDocumentType(): DocumentType {
    return DocumentType.TEXT;
  }

  public async loadDocument(source: string | File): Promise<void> {
    if (typeof source === 'string') {
      // Could be URL or direct content
      if (source.startsWith('http://') || source.startsWith('https://') || source.startsWith('/')) {
        const response = await fetch(source);
        this.content = await response.text();
      } else {
        this.content = source;
      }
    } else if (source instanceof File) {
      this.content = await source.text();
    }

    this.lines = this.content.split('\n');
  }

  public async renderDocument(): Promise<void> {
    this.documentContainer.innerHTML = '';

    const textViewer = document.createElement('div');
    textViewer.className = 'text-document-viewer';

    const lineNumbersContainer = document.createElement('div');
    lineNumbersContainer.className = 'text-line-numbers';

    const contentContainer = document.createElement('div');
    contentContainer.className = 'text-content';

    this.lines.forEach((line, index) => {
      // Line number
      const lineNumber = document.createElement('div');
      lineNumber.className = 'text-line-number';
      lineNumber.textContent = String(index + 1);
      lineNumber.dataset.line = String(index + 1);
      lineNumbersContainer.appendChild(lineNumber);

      // Line content
      const lineElement = document.createElement('div');
      lineElement.className = 'text-line';
      lineElement.dataset.line = String(index + 1);
      lineElement.textContent = line || '\u00A0'; // Non-breaking space for empty lines
      contentContainer.appendChild(lineElement);
    });

    textViewer.appendChild(lineNumbersContainer);
    textViewer.appendChild(contentContainer);
    this.documentContainer.appendChild(textViewer);
  }

  public createCommentOverlay(onCommentCreate: (position: CommentPosition) => void): void {
    const contentContainer = this.documentContainer.querySelector('.text-content');
    if (!contentContainer) return;

    contentContainer.addEventListener('click', (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const target = event.target as HTMLElement;
      if (target.classList.contains('text-line')) {
        const line = parseInt(target.dataset.line || '1', 10);
        const rect = target.getBoundingClientRect();
        const x = mouseEvent.clientX - rect.left;
        const charWidth = rect.width / (target.textContent?.length || 1);
        const column = Math.floor(x / charWidth);

        const position: TextPosition = {
          type: DocumentType.TEXT,
          line,
          column,
        };

        onCommentCreate(position);
      }
    });
  }

  public renderCommentMarker(comment: Comment): HTMLElement | null {
    if (comment.position.type !== DocumentType.TEXT) return null;

    const position = comment.position as TextPosition;
    const lineElement = this.documentContainer.querySelector(
      `.text-line[data-line="${position.line}"]`
    ) as HTMLElement;

    if (!lineElement) return null;

    const marker = document.createElement('div');
    marker.className = `comment-marker comment-marker--text ${
      comment.resolved ? 'comment-marker--resolved' : ''
    }`;
    marker.dataset.commentId = comment.id;
    marker.dataset.line = String(position.line);
    marker.innerHTML = '<span class="comment-marker-icon">💬</span>';

    // Position at the beginning of the line
    marker.style.position = 'absolute';
    marker.style.left = '-30px';

    lineElement.style.position = 'relative';
    lineElement.appendChild(marker);

    // Add highlight to the line
    lineElement.classList.add('text-line--commented');

    return marker;
  }

  protected getPositionFromEvent(event: MouseEvent, target: HTMLElement): CommentPosition | null {
    if (!target.classList.contains('text-line')) return null;

    const line = parseInt(target.dataset.line || '1', 10);
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const charWidth = rect.width / (target.textContent?.length || 1);
    const column = Math.floor(x / charWidth);

    return {
      type: DocumentType.TEXT,
      line,
      column,
    };
  }

  /**
   * Navigate to a specific line
   */
  public goToLine(line: number): void {
    const lineElement = this.documentContainer.querySelector(
      `.text-line[data-line="${line}"]`
    );

    if (lineElement) {
      lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
