import { BaseDocumentRenderer } from './BaseDocumentRenderer';
import { Comment, CommentPosition, DocumentType, ExcelPosition } from '../types';

interface CellData {
  value: string | number;
  style?: Record<string, string>;
}

interface Sheet {
  name: string;
  data: CellData[][];
}

/**
 * Renders Excel spreadsheets
 * Note: This is a simplified renderer. For production, consider using libraries like SheetJS (xlsx)
 */
export class ExcelDocumentRenderer extends BaseDocumentRenderer {
  private sheets: Sheet[] = [];
  private currentSheet = 0;

  public getDocumentType(): DocumentType {
    return DocumentType.EXCEL;
  }

  public async loadDocument(source: string | ArrayBuffer | File): Promise<void> {
    if (typeof source === 'string') {
      const response = await fetch(source);
      await response.arrayBuffer(); // In production: parse this with SheetJS
    } else if (source instanceof File) {
      await source.arrayBuffer(); // In production: parse this with SheetJS
    }
    // else: source is ArrayBuffer - in production, parse with SheetJS

    // In a real implementation, you would parse the Excel file here
    // For now, we'll create placeholder data
    await this.parseSpreadsheet();
  }

  private async parseSpreadsheet(): Promise<void> {
    // Placeholder: In production, use SheetJS (xlsx) library to parse
    // Create sample data for demonstration
    const sampleData: CellData[][] = [
      [{ value: 'Name' }, { value: 'Age' }, { value: 'Email' }, { value: 'Department' }],
      [{ value: 'John Doe' }, { value: 30 }, { value: 'john@example.com' }, { value: 'Engineering' }],
      [{ value: 'Jane Smith' }, { value: 28 }, { value: 'jane@example.com' }, { value: 'Marketing' }],
      [{ value: 'Bob Johnson' }, { value: 35 }, { value: 'bob@example.com' }, { value: 'Sales' }],
      [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
      [{ value: 'Total Employees' }, { value: 3 }, { value: '' }, { value: '' }],
    ];

    this.sheets.push({
      name: 'Sheet1',
      data: sampleData,
    });

    // Add a second sheet for demo
    this.sheets.push({
      name: 'Sheet2',
      data: [[{ value: 'Placeholder data for Sheet 2' }]],
    });
  }

  public async renderDocument(): Promise<void> {
    this.documentContainer.innerHTML = '';
    this.documentContainer.className = 'excel-document-viewer';

    // Render sheet tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'excel-sheet-tabs';

    this.sheets.forEach((sheet, index) => {
      const tab = document.createElement('button');
      tab.className = `excel-sheet-tab ${index === this.currentSheet ? 'excel-sheet-tab--active' : ''}`;
      tab.textContent = sheet.name;
      tab.dataset.sheetIndex = String(index);
      tab.addEventListener('click', () => this.switchSheet(index));
      tabsContainer.appendChild(tab);
    });

    this.documentContainer.appendChild(tabsContainer);

    // Render current sheet
    this.renderSheet(this.sheets[this.currentSheet]);
  }

  private renderSheet(sheet: Sheet): void {
    // Remove old sheet if exists
    const oldSheet = this.documentContainer.querySelector('.excel-sheet');
    if (oldSheet) {
      oldSheet.remove();
    }

    const sheetContainer = document.createElement('div');
    sheetContainer.className = 'excel-sheet';
    sheetContainer.style.transform = `scale(${this.scale})`;
    sheetContainer.style.transformOrigin = 'top left';

    const table = document.createElement('table');
    table.className = 'excel-table';

    // Add column headers (A, B, C, ...)
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // Corner cell

    const maxCols = Math.max(...sheet.data.map(row => row.length));
    for (let col = 0; col < maxCols; col++) {
      const th = document.createElement('th');
      th.className = 'excel-column-header';
      th.textContent = this.columnToLetter(col + 1);
      headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    // Add data rows
    sheet.data.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');

      // Row header
      const rowHeader = document.createElement('th');
      rowHeader.className = 'excel-row-header';
      rowHeader.textContent = String(rowIndex + 1);
      tr.appendChild(rowHeader);

      // Data cells
      for (let col = 0; col < maxCols; col++) {
        const cell = row[col] || { value: '' };
        const td = document.createElement('td');
        td.className = 'excel-cell';
        td.dataset.row = String(rowIndex + 1);
        td.dataset.col = String(col + 1);
        td.dataset.cellRef = `${this.columnToLetter(col + 1)}${rowIndex + 1}`;
        td.textContent = String(cell.value);

        if (cell.style) {
          Object.assign(td.style, cell.style);
        }

        tr.appendChild(td);
      }

      table.appendChild(tr);
    });

    sheetContainer.appendChild(table);
    this.documentContainer.appendChild(sheetContainer);
  }

  public createCommentOverlay(onCommentCreate: (position: CommentPosition) => void): void {
    this.documentContainer.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      if (target.classList.contains('excel-cell')) {
        const row = parseInt(target.dataset.row || '1', 10);
        const col = parseInt(target.dataset.col || '1', 10);
        const colLetter = this.columnToLetter(col);

        const position: ExcelPosition = {
          type: DocumentType.EXCEL,
          sheet: this.currentSheet,
          row,
          column: colLetter,
        };

        onCommentCreate(position);
      }
    });
  }

  public renderCommentMarker(comment: Comment): HTMLElement | null {
    if (comment.position.type !== DocumentType.EXCEL) return null;

    const position = comment.position as ExcelPosition;

    // Check if we're on the right sheet
    const sheetIndex = typeof position.sheet === 'number' ? position.sheet : 0;
    if (sheetIndex !== this.currentSheet) return null;

    const colNum = typeof position.column === 'string'
      ? this.letterToColumn(position.column)
      : position.column;

    const cell = this.documentContainer.querySelector(
      `.excel-cell[data-row="${position.row}"][data-col="${colNum}"]`
    ) as HTMLElement;

    if (!cell) return null;

    const marker = document.createElement('div');
    marker.className = `comment-marker comment-marker--excel ${
      comment.resolved ? 'comment-marker--resolved' : ''
    }`;
    marker.dataset.commentId = comment.id;
    marker.innerHTML = '<span class="comment-marker-icon">📝</span>';

    cell.style.position = 'relative';
    cell.classList.add('excel-cell--commented');
    cell.appendChild(marker);

    return marker;
  }

  protected getPositionFromEvent(_event: MouseEvent, target: HTMLElement): CommentPosition | null {
    if (!target.classList.contains('excel-cell')) return null;

    const row = parseInt(target.dataset.row || '1', 10);
    const col = parseInt(target.dataset.col || '1', 10);
    const colLetter = this.columnToLetter(col);

    return {
      type: DocumentType.EXCEL,
      sheet: this.currentSheet,
      row,
      column: colLetter,
    };
  }

  /**
   * Switch to a different sheet
   */
  private switchSheet(index: number): void {
    if (index < 0 || index >= this.sheets.length) return;

    this.currentSheet = index;
    this.renderDocument();
  }

  /**
   * Convert column number to letter (1 -> A, 2 -> B, etc.)
   */
  private columnToLetter(column: number): string {
    let letter = '';
    while (column > 0) {
      const remainder = (column - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      column = Math.floor((column - 1) / 26);
    }
    return letter;
  }

  /**
   * Convert column letter to number (A -> 1, B -> 2, etc.)
   */
  private letterToColumn(letter: string): number {
    let column = 0;
    for (let i = 0; i < letter.length; i++) {
      column = column * 26 + (letter.charCodeAt(i) - 64);
    }
    return column;
  }

  /**
   * Navigate to a specific cell
   */
  public goToCell(row: number, column: number | string): void {
    const colNum = typeof column === 'string' ? this.letterToColumn(column) : column;
    const cell = this.documentContainer.querySelector(
      `.excel-cell[data-row="${row}"][data-col="${colNum}"]`
    );

    if (cell) {
      cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
