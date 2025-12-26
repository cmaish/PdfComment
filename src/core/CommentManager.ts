import { Comment, CommentReply, CommentEvent, CommentEventType } from '../types';
import { generateId } from '../utils/idGenerator';
import { EventEmitter } from '../utils/eventEmitter';

/**
 * Manages all comments and their state
 */
export class CommentManager {
  private comments: Map<string, Comment> = new Map();
  private eventEmitter: EventEmitter<CommentEvent> = new EventEmitter();

  constructor(initialComments: Comment[] = []) {
    initialComments.forEach(comment => {
      this.comments.set(comment.id, comment);
    });
  }

  /**
   * Add a new comment
   */
  public addComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'replies' | 'resolved'>): Comment {
    const comment: Comment = {
      ...commentData,
      id: generateId(),
      createdAt: new Date(),
      replies: [],
      resolved: false,
    };

    this.comments.set(comment.id, comment);
    this.eventEmitter.emit(CommentEventType.CREATED, { type: CommentEventType.CREATED, comment });

    return comment;
  }

  /**
   * Get a comment by ID
   */
  public getComment(id: string): Comment | undefined {
    return this.comments.get(id);
  }

  /**
   * Get all comments
   */
  public getAllComments(): Comment[] {
    return Array.from(this.comments.values());
  }

  /**
   * Get comments by page number
   */
  public getCommentsByPage(page: number): Comment[] {
    return this.getAllComments().filter(comment => comment.position.page === page);
  }

  /**
   * Update a comment
   */
  public updateComment(id: string, updates: Partial<Comment>): Comment | null {
    const comment = this.comments.get(id);
    if (!comment) {
      return null;
    }

    const updatedComment: Comment = {
      ...comment,
      ...updates,
      id: comment.id, // Prevent ID from being changed
      createdAt: comment.createdAt, // Prevent creation date from being changed
      updatedAt: new Date(),
    };

    this.comments.set(id, updatedComment);
    this.eventEmitter.emit(CommentEventType.UPDATED, { type: CommentEventType.UPDATED, comment: updatedComment });

    return updatedComment;
  }

  /**
   * Delete a comment
   */
  public deleteComment(id: string): boolean {
    const comment = this.comments.get(id);
    if (!comment) {
      return false;
    }

    this.comments.delete(id);
    this.eventEmitter.emit(CommentEventType.DELETED, { type: CommentEventType.DELETED, comment });

    return true;
  }

  /**
   * Add a reply to a comment
   */
  public addReply(commentId: string, replyData: Omit<CommentReply, 'id' | 'createdAt'>): CommentReply | null {
    const comment = this.comments.get(commentId);
    if (!comment) {
      return null;
    }

    const reply: CommentReply = {
      ...replyData,
      id: generateId(),
      createdAt: new Date(),
    };

    comment.replies.push(reply);
    comment.updatedAt = new Date();

    this.eventEmitter.emit(CommentEventType.REPLY_ADDED, {
      type: CommentEventType.REPLY_ADDED,
      comment,
      reply
    });

    return reply;
  }

  /**
   * Update a reply
   */
  public updateReply(commentId: string, replyId: string, updates: Partial<CommentReply>): CommentReply | null {
    const comment = this.comments.get(commentId);
    if (!comment) {
      return null;
    }

    const replyIndex = comment.replies.findIndex(r => r.id === replyId);
    if (replyIndex === -1) {
      return null;
    }

    const updatedReply: CommentReply = {
      ...comment.replies[replyIndex],
      ...updates,
      id: replyId, // Prevent ID from being changed
      updatedAt: new Date(),
    };

    comment.replies[replyIndex] = updatedReply;
    comment.updatedAt = new Date();

    this.eventEmitter.emit(CommentEventType.REPLY_UPDATED, {
      type: CommentEventType.REPLY_UPDATED,
      comment,
      reply: updatedReply
    });

    return updatedReply;
  }

  /**
   * Delete a reply
   */
  public deleteReply(commentId: string, replyId: string): boolean {
    const comment = this.comments.get(commentId);
    if (!comment) {
      return false;
    }

    const replyIndex = comment.replies.findIndex(r => r.id === replyId);
    if (replyIndex === -1) {
      return false;
    }

    const reply = comment.replies[replyIndex];
    comment.replies.splice(replyIndex, 1);
    comment.updatedAt = new Date();

    this.eventEmitter.emit(CommentEventType.REPLY_DELETED, {
      type: CommentEventType.REPLY_DELETED,
      comment,
      reply
    });

    return true;
  }

  /**
   * Toggle resolved status
   */
  public toggleResolve(commentId: string): Comment | null {
    const comment = this.comments.get(commentId);
    if (!comment) {
      return null;
    }

    comment.resolved = !comment.resolved;
    comment.updatedAt = new Date();

    this.eventEmitter.emit(CommentEventType.RESOLVED, {
      type: CommentEventType.RESOLVED,
      comment
    });

    return comment;
  }

  /**
   * Subscribe to comment events
   */
  public on(event: CommentEventType, callback: (event: CommentEvent) => void): () => void {
    return this.eventEmitter.on(event, callback);
  }

  /**
   * Unsubscribe from comment events
   */
  public off(event: CommentEventType, callback: (event: CommentEvent) => void): void {
    this.eventEmitter.off(event, callback);
  }
}
