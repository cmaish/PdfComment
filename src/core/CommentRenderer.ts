import { Comment, CommentEvent, CommentEventType } from '../types';
import { EventEmitter } from '../utils/eventEmitter';

/**
 * Renders comment markers on PDF pages
 */
export class CommentRenderer {
  private eventEmitter: EventEmitter<CommentEvent>;

  constructor(eventEmitter: EventEmitter<CommentEvent>) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Render a comment marker on a PDF overlay
   */
  public renderCommentMarker(overlay: HTMLElement, comment: Comment): void {
    // Only render PDF comments with this renderer
    if (comment.position.type !== 'pdf') return;

    const position = comment.position as any;
    const marker = document.createElement('div');
    marker.className = this.getMarkerClassName(comment);
    marker.dataset.commentId = comment.id;
    marker.style.left = `${position.x * 100}%`;
    marker.style.top = `${position.y * 100}%`;

    // Add number badge
    const badge = document.createElement('span');
    badge.className = 'pdf-comment-marker-badge';
    badge.textContent = '💬';
    marker.appendChild(badge);

    // Add highlight rectangle if exists
    if (comment.rect) {
      const highlight = document.createElement('div');
      highlight.className = 'pdf-comment-highlight';
      highlight.style.left = `${position.x * 100}%`;
      highlight.style.top = `${position.y * 100}%`;
      highlight.style.width = `${comment.rect.width * 100}%`;
      highlight.style.height = `${comment.rect.height * 100}%`;
      overlay.appendChild(highlight);
    }

    // Click handler to select comment
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      this.eventEmitter.emit(CommentEventType.SELECTED, {
        type: CommentEventType.SELECTED,
        comment
      });
    });

    overlay.appendChild(marker);
  }

  /**
   * Get the CSS class name for a comment marker based on its state
   */
  public getMarkerClassName(comment: Comment): string {
    const classes = ['pdf-comment-marker'];

    if (comment.resolved) {
      classes.push('pdf-comment-marker--resolved');
    }

    if (comment.replies.length > 0) {
      classes.push('pdf-comment-marker--has-replies');
    }

    return classes.join(' ');
  }
}
