import { Comment, CommentAuthor, CommentEvent, CommentEventType, PdfCommentOptions, DocumentType } from '../types';
import { CommentManager } from '../core/CommentManager';
import { EventEmitter } from '../utils/eventEmitter';
import { generateId, generateColor } from '../utils/idGenerator';

/**
 * Manages comment UI components (dialogs, panels, etc.)
 */
export class CommentUI {
  private commentManager: CommentManager;
  private options: PdfCommentOptions;
  private eventEmitter: EventEmitter<CommentEvent>;
  private currentUser: CommentAuthor;
  private sidebar: HTMLElement | null = null;
  private activeCommentId: string | null = null;

  constructor(
    commentManager: CommentManager,
    options: PdfCommentOptions,
    eventEmitter: EventEmitter<CommentEvent>
  ) {
    this.commentManager = commentManager;
    this.options = options;
    this.eventEmitter = eventEmitter;

    // Setup current user
    this.currentUser = options.currentUser || {
      id: generateId(),
      name: 'Anonymous',
      color: generateColor(),
    };

    this.createSidebar();
    this.setupEventListeners();
  }

  /**
   * Create the comments sidebar
   */
  private createSidebar(): void {
    this.sidebar = document.createElement('div');
    this.sidebar.className = 'pdf-comment-sidebar';
    this.options.container.appendChild(this.sidebar);

    this.updateSidebar();
  }

  /**
   * Update sidebar content with all comments
   */
  private updateSidebar(): void {
    if (!this.sidebar) return;

    const comments = this.commentManager.getAllComments();

    this.sidebar.innerHTML = `
      <div class="pdf-comment-sidebar-header">
        <h3>Comments (${comments.length})</h3>
        <button class="pdf-comment-close-btn" data-action="close">×</button>
      </div>
      <div class="pdf-comment-sidebar-content">
        ${comments.length === 0
          ? '<p class="pdf-comment-empty">No comments yet. Click on the PDF to add one.</p>'
          : comments.map(c => this.renderCommentCard(c)).join('')
        }
      </div>
    `;

    this.attachSidebarEventListeners();
  }

  /**
   * Render a comment card
   */
  private renderCommentCard(comment: Comment): string {
    const isActive = comment.id === this.activeCommentId;
    const timeStr = this.formatDate(comment.createdAt);

    return `
      <div class="pdf-comment-card ${isActive ? 'pdf-comment-card--active' : ''} ${comment.resolved ? 'pdf-comment-card--resolved' : ''}"
           data-comment-id="${comment.id}">
        <div class="pdf-comment-card-header">
          <div class="pdf-comment-author">
            <div class="pdf-comment-avatar" style="background-color: ${comment.author.color || '#6C5CE7'}">
              ${comment.author.name.charAt(0).toUpperCase()}
            </div>
            <div class="pdf-comment-author-info">
              <span class="pdf-comment-author-name">${this.escapeHtml(comment.author.name)}</span>
              <span class="pdf-comment-timestamp">${timeStr}</span>
            </div>
          </div>
          <div class="pdf-comment-actions">
            ${comment.resolved
              ? '<span class="pdf-comment-resolved-badge">✓ Resolved</span>'
              : ''
            }
            <button class="pdf-comment-action-btn" data-action="menu" data-comment-id="${comment.id}">⋮</button>
          </div>
        </div>
        <div class="pdf-comment-card-content">
          <p>${this.escapeHtml(comment.content)}</p>
          ${comment.highlightedText
            ? `<div class="pdf-comment-highlight-text">"${this.escapeHtml(comment.highlightedText)}"</div>`
            : ''
          }
        </div>
        ${comment.replies.length > 0 ? `
          <div class="pdf-comment-replies">
            ${comment.replies.map(reply => `
              <div class="pdf-comment-reply">
                <div class="pdf-comment-author">
                  <div class="pdf-comment-avatar pdf-comment-avatar--small" style="background-color: ${reply.author.color || '#6C5CE7'}">
                    ${reply.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div class="pdf-comment-author-info">
                    <span class="pdf-comment-author-name">${this.escapeHtml(reply.author.name)}</span>
                    <span class="pdf-comment-timestamp">${this.formatDate(reply.createdAt)}</span>
                  </div>
                </div>
                <p class="pdf-comment-reply-content">${this.escapeHtml(reply.content)}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${this.options.enableReplies ? `
          <div class="pdf-comment-reply-form">
            <textarea class="pdf-comment-reply-input" placeholder="Write a reply..." data-comment-id="${comment.id}"></textarea>
            <button class="pdf-comment-reply-btn" data-action="reply" data-comment-id="${comment.id}">Reply</button>
          </div>
        ` : ''}
        <div class="pdf-comment-footer">
          <button class="pdf-comment-btn pdf-comment-btn--secondary" data-action="goto" data-comment-id="${comment.id}">
            ${this.getLocationText(comment)}
          </button>
          ${!comment.resolved ? `
            <button class="pdf-comment-btn pdf-comment-btn--primary" data-action="resolve" data-comment-id="${comment.id}">
              Mark as resolved
            </button>
          ` : `
            <button class="pdf-comment-btn pdf-comment-btn--secondary" data-action="unresolve" data-comment-id="${comment.id}">
              Reopen
            </button>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Show dialog to create a new comment
   */
  public showCommentDialog(page: number, x: number, y: number): void {
    const dialog = document.createElement('div');
    dialog.className = 'pdf-comment-dialog';
    dialog.innerHTML = `
      <div class="pdf-comment-dialog-content">
        <h4>Add Comment</h4>
        <textarea class="pdf-comment-input" placeholder="Write your comment..." autofocus></textarea>
        <div class="pdf-comment-dialog-actions">
          <button class="pdf-comment-btn pdf-comment-btn--secondary" data-action="cancel">Cancel</button>
          <button class="pdf-comment-btn pdf-comment-btn--primary" data-action="save">Add Comment</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const textarea = dialog.querySelector('textarea') as HTMLTextAreaElement;
    textarea.focus();

    // Handle actions
    dialog.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;

      if (action === 'cancel') {
        dialog.remove();
      } else if (action === 'save') {
        const content = textarea.value.trim();
        if (content) {
          this.commentManager.addComment({
            content,
            author: this.currentUser,
            position: { type: DocumentType.PDF, page, x, y },
          });
          dialog.remove();
        }
      }
    });

    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });

    // Close on Escape
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        dialog.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Attach event listeners to sidebar elements
   */
  private attachSidebarEventListeners(): void {
    if (!this.sidebar) return;

    this.sidebar.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;
      const commentId = target.dataset.commentId;

      if (action === 'close') {
        this.sidebar?.classList.toggle('pdf-comment-sidebar--hidden');
      } else if (action === 'resolve' && commentId) {
        this.commentManager.toggleResolve(commentId);
      } else if (action === 'unresolve' && commentId) {
        this.commentManager.toggleResolve(commentId);
      } else if (action === 'reply' && commentId) {
        const input = this.sidebar?.querySelector(
          `textarea[data-comment-id="${commentId}"]`
        ) as HTMLTextAreaElement;
        if (input) {
          const content = input.value.trim();
          if (content) {
            this.commentManager.addReply(commentId, {
              content,
              author: this.currentUser,
            });
            input.value = '';
          }
        }
      }
    });
  }

  /**
   * Setup event listeners for comment events
   */
  private setupEventListeners(): void {
    this.commentManager.on(CommentEventType.CREATED, () => {
      this.updateSidebar();
    });

    this.commentManager.on(CommentEventType.UPDATED, () => {
      this.updateSidebar();
    });

    this.commentManager.on(CommentEventType.DELETED, () => {
      this.updateSidebar();
    });

    this.commentManager.on(CommentEventType.RESOLVED, () => {
      this.updateSidebar();
    });

    this.commentManager.on(CommentEventType.REPLY_ADDED, () => {
      this.updateSidebar();
    });

    this.eventEmitter.on(CommentEventType.SELECTED, (event) => {
      this.activeCommentId = event.comment.id;
      this.updateSidebar();
      this.sidebar?.classList.remove('pdf-comment-sidebar--hidden');
    });
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get location text based on position type
   */
  private getLocationText(comment: Comment): string {
    const pos = comment.position;
    switch (pos.type) {
      case DocumentType.PDF:
      case DocumentType.WORD:
        return `Go to page ${(pos as any).page + 1}`;
      case DocumentType.TEXT:
        return `Go to line ${(pos as any).line}`;
      case DocumentType.EXCEL:
        return `Go to ${(pos as any).column}${(pos as any).row}`;
      default:
        return 'Go to location';
    }
  }

  /**
   * Destroy the UI and clean up
   */
  public destroy(): void {
    this.sidebar?.remove();
  }
}
