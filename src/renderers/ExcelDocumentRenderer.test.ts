import { ExcelDocumentRenderer } from './ExcelDocumentRenderer';
import { DocumentType, Comment } from '../types';

describe('ExcelDocumentRenderer', () => {
  let container: HTMLElement;
  let renderer: ExcelDocumentRenderer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    renderer = new ExcelDocumentRenderer(container);
  });

  afterEach(() => {
    renderer.destroy();
    document.body.removeChild(container);
  });

  describe('getDocumentType', () => {
    it('should return EXCEL document type', () => {
      expect(renderer.getDocumentType()).toBe(DocumentType.EXCEL);
    });
  });

  describe('loadDocument', () => {
    it('should load and parse spreadsheet data', async () => {
      const mockBuffer = new ArrayBuffer(8);
      await renderer.loadDocument(mockBuffer);
      await renderer.renderDocument();

      expect(container.querySelector('.excel-document-viewer')).toBeTruthy();
      expect(container.querySelector('.excel-sheet-tabs')).toBeTruthy();
      expect(container.querySelector('.excel-sheet')).toBeTruthy();
    });
  });

  describe('renderDocument', () => {
    beforeEach(async () => {
      const mockBuffer = new ArrayBuffer(8);
      await renderer.loadDocument(mockBuffer);
      await renderer.renderDocument();
    });

    it('should render sheet tabs', () => {
      const tabs = container.querySelectorAll('.excel-sheet-tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('should render table with headers', () => {
      const table = container.querySelector('.excel-table');
      expect(table).toBeTruthy();

      const columnHeaders = container.querySelectorAll('.excel-column-header');
      expect(columnHeaders.length).toBeGreaterThan(0);

      const rowHeaders = container.querySelectorAll('.excel-row-header');
      expect(rowHeaders.length).toBeGreaterThan(0);
    });

    it('should render cells with data', () => {
      const cells = container.querySelectorAll('.excel-cell');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should mark first tab as active', () => {
      const activeTab = container.querySelector('.excel-sheet-tab--active');
      expect(activeTab).toBeTruthy();
      expect(activeTab?.textContent).toBe('Sheet1');
    });
  });

  describe('renderCommentMarker', () => {
    beforeEach(async () => {
      const mockBuffer = new ArrayBuffer(8);
      await renderer.loadDocument(mockBuffer);
      await renderer.renderDocument();
    });

    it('should render a comment marker on the correct cell', () => {
      const comment: Comment = {
        id: 'comment1',
        content: 'Test comment',
        author: { id: 'user1', name: 'User' },
        position: { type: DocumentType.EXCEL, sheet: 0, row: 1, column: 'A' },
        createdAt: new Date(),
        replies: [],
        resolved: false,
      };

      const marker = renderer.renderCommentMarker(comment);

      expect(marker).toBeTruthy();
      expect(marker?.dataset.commentId).toBe('comment1');
    });

    it('should add commented class to cell', () => {
      const comment: Comment = {
        id: 'comment1',
        content: 'Test comment',
        author: { id: 'user1', name: 'User' },
        position: { type: DocumentType.EXCEL, sheet: 0, row: 1, column: 'A' },
        createdAt: new Date(),
        replies: [],
        resolved: false,
      };

      renderer.renderCommentMarker(comment);

      const cell = container.querySelector('.excel-cell[data-row="1"][data-col="1"]');
      expect(cell?.classList.contains('excel-cell--commented')).toBe(true);
    });

    it('should return null for non-EXCEL position', () => {
      const comment: Comment = {
        id: 'comment1',
        content: 'Test comment',
        author: { id: 'user1', name: 'User' },
        position: { type: DocumentType.TEXT, line: 1, column: 0 },
        createdAt: new Date(),
        replies: [],
        resolved: false,
      };

      const marker = renderer.renderCommentMarker(comment);

      expect(marker).toBeNull();
    });

    it('should return null for comment on different sheet', () => {
      const comment: Comment = {
        id: 'comment1',
        content: 'Test comment',
        author: { id: 'user1', name: 'User' },
        position: { type: DocumentType.EXCEL, sheet: 1, row: 1, column: 'A' },
        createdAt: new Date(),
        replies: [],
        resolved: false,
      };

      const marker = renderer.renderCommentMarker(comment);

      expect(marker).toBeNull(); // Currently on sheet 0
    });
  });

  describe('column conversion', () => {
    it('should convert column numbers to letters', () => {
      const convertFn = (renderer as any).columnToLetter.bind(renderer);

      expect(convertFn(1)).toBe('A');
      expect(convertFn(26)).toBe('Z');
      expect(convertFn(27)).toBe('AA');
      expect(convertFn(52)).toBe('AZ');
      expect(convertFn(53)).toBe('BA');
    });

    it('should convert column letters to numbers', () => {
      const convertFn = (renderer as any).letterToColumn.bind(renderer);

      expect(convertFn('A')).toBe(1);
      expect(convertFn('Z')).toBe(26);
      expect(convertFn('AA')).toBe(27);
      expect(convertFn('AZ')).toBe(52);
      expect(convertFn('BA')).toBe(53);
    });
  });
});
