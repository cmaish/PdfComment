import { CommentManager } from './CommentManager';
import { Comment, CommentEventType, DocumentType } from '../types';

describe('CommentManager', () => {
  let manager: CommentManager;

  const mockAuthor = {
    id: 'user1',
    name: 'Test User',
    color: '#6C5CE7',
  };

  const mockComment: Omit<Comment, 'id' | 'createdAt' | 'replies' | 'resolved'> = {
    content: 'Test comment',
    author: mockAuthor,
    position: { type: DocumentType.PDF, page: 0, x: 0.5, y: 0.5 },
  };

  beforeEach(() => {
    manager = new CommentManager();
  });

  describe('addComment', () => {
    it('should add a new comment', () => {
      const comment = manager.addComment(mockComment);

      expect(comment).toMatchObject({
        content: 'Test comment',
        author: mockAuthor,
        position: { page: 0, x: 0.5, y: 0.5 },
      });
      expect(comment.id).toBeTruthy();
      expect(comment.createdAt).toBeInstanceOf(Date);
      expect(comment.replies).toEqual([]);
      expect(comment.resolved).toBe(false);
    });

    it('should emit CREATED event', () => {
      const callback = jest.fn();
      manager.on(CommentEventType.CREATED, callback);

      const comment = manager.addComment(mockComment);

      expect(callback).toHaveBeenCalledWith({
        type: CommentEventType.CREATED,
        comment,
      });
    });

    it('should generate unique IDs', () => {
      const comment1 = manager.addComment(mockComment);
      const comment2 = manager.addComment(mockComment);

      expect(comment1.id).not.toBe(comment2.id);
    });
  });

  describe('getComment', () => {
    it('should return a comment by ID', () => {
      const comment = manager.addComment(mockComment);
      const retrieved = manager.getComment(comment.id);

      expect(retrieved).toEqual(comment);
    });

    it('should return undefined for non-existent ID', () => {
      const retrieved = manager.getComment('non-existent');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllComments', () => {
    it('should return all comments', () => {
      const comment1 = manager.addComment(mockComment);
      const comment2 = manager.addComment(mockComment);

      const all = manager.getAllComments();

      expect(all).toHaveLength(2);
      expect(all).toContainEqual(comment1);
      expect(all).toContainEqual(comment2);
    });

    it('should return empty array when no comments', () => {
      const all = manager.getAllComments();

      expect(all).toEqual([]);
    });
  });

  describe('getCommentsByPage', () => {
    it('should return comments for specific page', () => {
      const comment1 = manager.addComment({ ...mockComment, position: { type: DocumentType.PDF, page: 0, x: 0.5, y: 0.5 } });
      const comment2 = manager.addComment({ ...mockComment, position: { type: DocumentType.PDF, page: 1, x: 0.5, y: 0.5 } });
      const comment3 = manager.addComment({ ...mockComment, position: { type: DocumentType.PDF, page: 0, x: 0.3, y: 0.3 } });

      const page0Comments = manager.getCommentsByPage(0);
      const page1Comments = manager.getCommentsByPage(1);

      expect(page0Comments).toHaveLength(2);
      expect(page0Comments).toContainEqual(comment1);
      expect(page0Comments).toContainEqual(comment3);
      expect(page1Comments).toHaveLength(1);
      expect(page1Comments).toContainEqual(comment2);
    });
  });

  describe('updateComment', () => {
    it('should update a comment', () => {
      const comment = manager.addComment(mockComment);
      const updated = manager.updateComment(comment.id, {
        content: 'Updated content',
      });

      expect(updated).toMatchObject({
        id: comment.id,
        content: 'Updated content',
      });
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should emit UPDATED event', () => {
      const comment = manager.addComment(mockComment);
      const callback = jest.fn();
      manager.on(CommentEventType.UPDATED, callback);

      const updated = manager.updateComment(comment.id, {
        content: 'Updated',
      });

      expect(callback).toHaveBeenCalledWith({
        type: CommentEventType.UPDATED,
        comment: updated,
      });
    });

    it('should return null for non-existent comment', () => {
      const result = manager.updateComment('non-existent', {
        content: 'Updated',
      });

      expect(result).toBeNull();
    });

    it('should not allow changing ID or createdAt', () => {
      const comment = manager.addComment(mockComment);
      const originalId = comment.id;
      const originalCreatedAt = comment.createdAt;

      manager.updateComment(comment.id, {
        id: 'new-id',
        createdAt: new Date(2020, 0, 1),
      } as Partial<Comment>);

      const updated = manager.getComment(originalId);

      expect(updated?.id).toBe(originalId);
      expect(updated?.createdAt).toBe(originalCreatedAt);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', () => {
      const comment = manager.addComment(mockComment);
      const result = manager.deleteComment(comment.id);

      expect(result).toBe(true);
      expect(manager.getComment(comment.id)).toBeUndefined();
    });

    it('should emit DELETED event', () => {
      const comment = manager.addComment(mockComment);
      const callback = jest.fn();
      manager.on(CommentEventType.DELETED, callback);

      manager.deleteComment(comment.id);

      expect(callback).toHaveBeenCalledWith({
        type: CommentEventType.DELETED,
        comment,
      });
    });

    it('should return false for non-existent comment', () => {
      const result = manager.deleteComment('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('addReply', () => {
    it('should add a reply to a comment', () => {
      const comment = manager.addComment(mockComment);
      const reply = manager.addReply(comment.id, {
        content: 'Reply content',
        author: mockAuthor,
      });

      expect(reply).toMatchObject({
        content: 'Reply content',
        author: mockAuthor,
      });
      expect(reply?.id).toBeTruthy();
      expect(reply?.createdAt).toBeInstanceOf(Date);

      const updated = manager.getComment(comment.id);
      expect(updated?.replies).toHaveLength(1);
      expect(updated?.replies[0]).toEqual(reply);
    });

    it('should emit REPLY_ADDED event', () => {
      const comment = manager.addComment(mockComment);
      const callback = jest.fn();
      manager.on(CommentEventType.REPLY_ADDED, callback);

      const reply = manager.addReply(comment.id, {
        content: 'Reply',
        author: mockAuthor,
      });

      expect(callback).toHaveBeenCalledWith({
        type: CommentEventType.REPLY_ADDED,
        comment: expect.any(Object),
        reply,
      });
    });

    it('should return null for non-existent comment', () => {
      const result = manager.addReply('non-existent', {
        content: 'Reply',
        author: mockAuthor,
      });

      expect(result).toBeNull();
    });
  });

  describe('updateReply', () => {
    it('should update a reply', () => {
      const comment = manager.addComment(mockComment);
      const reply = manager.addReply(comment.id, {
        content: 'Original',
        author: mockAuthor,
      });

      const updated = manager.updateReply(comment.id, reply!.id, {
        content: 'Updated',
      });

      expect(updated).toMatchObject({
        id: reply?.id,
        content: 'Updated',
      });
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should emit REPLY_UPDATED event', () => {
      const comment = manager.addComment(mockComment);
      const reply = manager.addReply(comment.id, {
        content: 'Original',
        author: mockAuthor,
      });
      const callback = jest.fn();
      manager.on(CommentEventType.REPLY_UPDATED, callback);

      const updated = manager.updateReply(comment.id, reply!.id, {
        content: 'Updated',
      });

      expect(callback).toHaveBeenCalledWith({
        type: CommentEventType.REPLY_UPDATED,
        comment: expect.any(Object),
        reply: updated,
      });
    });
  });

  describe('deleteReply', () => {
    it('should delete a reply', () => {
      const comment = manager.addComment(mockComment);
      const reply = manager.addReply(comment.id, {
        content: 'Reply',
        author: mockAuthor,
      });

      const result = manager.deleteReply(comment.id, reply!.id);

      expect(result).toBe(true);

      const updated = manager.getComment(comment.id);
      expect(updated?.replies).toHaveLength(0);
    });

    it('should emit REPLY_DELETED event', () => {
      const comment = manager.addComment(mockComment);
      const reply = manager.addReply(comment.id, {
        content: 'Reply',
        author: mockAuthor,
      });
      const callback = jest.fn();
      manager.on(CommentEventType.REPLY_DELETED, callback);

      manager.deleteReply(comment.id, reply!.id);

      expect(callback).toHaveBeenCalledWith({
        type: CommentEventType.REPLY_DELETED,
        comment: expect.any(Object),
        reply,
      });
    });
  });

  describe('toggleResolve', () => {
    it('should toggle resolved status', () => {
      const comment = manager.addComment(mockComment);

      expect(comment.resolved).toBe(false);

      const resolved = manager.toggleResolve(comment.id);
      expect(resolved?.resolved).toBe(true);

      const unresolved = manager.toggleResolve(comment.id);
      expect(unresolved?.resolved).toBe(false);
    });

    it('should emit RESOLVED event', () => {
      const comment = manager.addComment(mockComment);
      const callback = jest.fn();
      manager.on(CommentEventType.RESOLVED, callback);

      const resolved = manager.toggleResolve(comment.id);

      expect(callback).toHaveBeenCalledWith({
        type: CommentEventType.RESOLVED,
        comment: resolved,
      });
    });

    it('should return null for non-existent comment', () => {
      const result = manager.toggleResolve('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('initialization with comments', () => {
    it('should initialize with existing comments', () => {
      const existingComments: Comment[] = [
        {
          id: 'comment1',
          content: 'Comment 1',
          author: mockAuthor,
          position: { type: DocumentType.PDF, page: 0, x: 0.5, y: 0.5 },
          createdAt: new Date(),
          replies: [],
          resolved: false,
        },
        {
          id: 'comment2',
          content: 'Comment 2',
          author: mockAuthor,
          position: { type: DocumentType.PDF, page: 1, x: 0.3, y: 0.7 },
          createdAt: new Date(),
          replies: [],
          resolved: true,
        },
      ];

      const manager = new CommentManager(existingComments);
      const all = manager.getAllComments();

      expect(all).toHaveLength(2);
      expect(all).toContainEqual(existingComments[0]);
      expect(all).toContainEqual(existingComments[1]);
    });
  });
});
