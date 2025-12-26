import { TextDocumentRenderer } from './TextDocumentRenderer';
import { DocumentType, Comment } from '../types';

describe('TextDocumentRenderer', () => {
  let container: HTMLElement;
  let renderer: TextDocumentRenderer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    renderer = new TextDocumentRenderer(container);
  });

  afterEach(() => {
    renderer.destroy();
    document.body.removeChild(container);
  });

  describe('getDocumentType', () => {
    it('should return TEXT document type', () => {
      expect(renderer.getDocumentType()).toBe(DocumentType.TEXT);
    });
  });

  describe('loadDocument', () => {
    it('should load text content from string', async () => {
      const content = 'Line 1\nLine 2\nLine 3';
      await renderer.loadDocument(content);
      await renderer.renderDocument();

      const lines = container.querySelectorAll('.text-line');
      expect(lines).toHaveLength(3);
      expect(lines[0].textContent).toBe('Line 1');
      expect(lines[1].textContent).toBe('Line 2');
      expect(lines[2].textContent).toBe('Line 3');
    });

    it('should handle empty lines', async () => {
      const content = 'Line 1\n\nLine 3';
      await renderer.loadDocument(content);
      await renderer.renderDocument();

      const lines = container.querySelectorAll('.text-line');
      expect(lines).toHaveLength(3);
      expect(lines[1].textContent).toBe('\u00A0'); // Non-breaking space
    });
  });

  describe('renderDocument', () => {
    it('should render line numbers', async () => {
      const content = 'Line 1\nLine 2\nLine 3';
      await renderer.loadDocument(content);
      await renderer.renderDocument();

      const lineNumbers = container.querySelectorAll('.text-line-number');
      expect(lineNumbers).toHaveLength(3);
      expect(lineNumbers[0].textContent).toBe('1');
      expect(lineNumbers[1].textContent).toBe('2');
      expect(lineNumbers[2].textContent).toBe('3');
    });

    it('should create proper structure', async () => {
      const content = 'Test';
      await renderer.loadDocument(content);
      await renderer.renderDocument();

      expect(container.querySelector('.text-document-viewer')).toBeTruthy();
      expect(container.querySelector('.text-line-numbers')).toBeTruthy();
      expect(container.querySelector('.text-content')).toBeTruthy();
    });
  });

  describe('renderCommentMarker', () => {
    beforeEach(async () => {
      const content = 'Line 1\nLine 2\nLine 3';
      await renderer.loadDocument(content);
      await renderer.renderDocument();
    });

    it('should render a comment marker on the correct line', () => {
      const comment: Comment = {
        id: 'comment1',
        content: 'Test comment',
        author: { id: 'user1', name: 'User' },
        position: { type: DocumentType.TEXT, line: 2, column: 0 },
        createdAt: new Date(),
        replies: [],
        resolved: false,
      };

      const marker = renderer.renderCommentMarker(comment);

      expect(marker).toBeTruthy();
      expect(marker?.dataset.commentId).toBe('comment1');
      expect(marker?.dataset.line).toBe('2');
    });

    it('should add commented class to line', () => {
      const comment: Comment = {
        id: 'comment1',
        content: 'Test comment',
        author: { id: 'user1', name: 'User' },
        position: { type: DocumentType.TEXT, line: 1, column: 0 },
        createdAt: new Date(),
        replies: [],
        resolved: false,
      };

      renderer.renderCommentMarker(comment);

      const line = container.querySelector('.text-line[data-line="1"]');
      expect(line?.classList.contains('text-line--commented')).toBe(true);
    });

    it('should handle resolved comments', () => {
      const comment: Comment = {
        id: 'comment1',
        content: 'Test comment',
        author: { id: 'user1', name: 'User' },
        position: { type: DocumentType.TEXT, line: 1, column: 0 },
        createdAt: new Date(),
        replies: [],
        resolved: true,
      };

      const marker = renderer.renderCommentMarker(comment);

      expect(marker?.classList.contains('comment-marker--resolved')).toBe(true);
    });

    it('should return null for non-TEXT position', () => {
      const comment: Comment = {
        id: 'comment1',
        content: 'Test comment',
        author: { id: 'user1', name: 'User' },
        position: { type: DocumentType.WORD, page: 0, x: 0.5, y: 0.5 },
        createdAt: new Date(),
        replies: [],
        resolved: false,
      };

      const marker = renderer.renderCommentMarker(comment);

      expect(marker).toBeNull();
    });
  });

  describe('removeCommentMarker', () => {
    beforeEach(async () => {
      const content = 'Line 1\nLine 2';
      await renderer.loadDocument(content);
      await renderer.renderDocument();
    });

    it('should remove a comment marker', () => {
      const comment: Comment = {
        id: 'comment1',
        content: 'Test comment',
        author: { id: 'user1', name: 'User' },
        position: { type: DocumentType.TEXT, line: 1, column: 0 },
        createdAt: new Date(),
        replies: [],
        resolved: false,
      };

      renderer.renderCommentMarker(comment);
      expect(container.querySelector('[data-comment-id="comment1"]')).toBeTruthy();

      renderer.removeCommentMarker('comment1');
      expect(container.querySelector('[data-comment-id="comment1"]')).toBeFalsy();
    });
  });

  describe('goToLine', () => {
    beforeEach(async () => {
      const content = Array(50).fill('Test line').join('\n');
      await renderer.loadDocument(content);
      await renderer.renderDocument();
    });

    it('should scroll to the specified line', () => {
      const line25 = container.querySelector('.text-line[data-line="25"]') as HTMLElement;
      const scrollIntoViewMock = jest.fn();
      line25.scrollIntoView = scrollIntoViewMock;

      renderer.goToLine(25);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });
  });

  describe('zoom', () => {
    beforeEach(async () => {
      const content = 'Test line';
      await renderer.loadDocument(content);
      await renderer.renderDocument();
    });

    it('should zoom in', () => {
      const initialScale = (renderer as any).scale;
      renderer.zoomIn();
      expect((renderer as any).scale).toBe(initialScale * 1.2);
    });

    it('should zoom out', () => {
      const initialScale = (renderer as any).scale;
      renderer.zoomOut();
      expect((renderer as any).scale).toBe(initialScale / 1.2);
    });
  });
});
