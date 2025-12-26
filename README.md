# Document Comment Library

A beautiful, TypeScript-based library for adding and displaying comments on documents in the browser. Supports **PDF, Word, Excel, and Text files** with an elegant and intuitive user interface.

## Features

- **Multi-Document Support**: PDF, Word (DOCX), Excel (XLSX), and Text files
- **Interactive Comments**: Click anywhere on any document to add comments
- **Rich Comment System**:
  - Add, edit, and delete comments
  - Reply to comments with threaded conversations
  - Resolve/unresolve comments
  - Mark comments with custom tags
  - Highlight text selections
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Event-Driven**: Subscribe to comment events for custom integrations
- **TypeScript**: Fully typed for excellent developer experience
- **Customizable**: Theme support for matching your brand
- **Accessible**: Keyboard navigation and screen reader support

## Supported Document Types

| Document Type | Position System | Features |
|---------------|----------------|----------|
| **PDF** | Page + X/Y coordinates | Full PDF.js integration, page-based comments |
| **Text Files** | Line + Column | Syntax highlighting, line-based comments |
| **Word Documents** | Page + X/Y coordinates | Page-based layout, paragraph tracking |
| **Excel Spreadsheets** | Sheet + Row + Column | Multi-sheet support, cell-based comments |

## Installation

```bash
npm install pdf-comment
```

## Quick Start

### PDF Documents

```typescript
import { PdfCommentViewer } from 'pdf-comment';
import 'pdf-comment/dist/styles.css';

const viewer = new PdfCommentViewer({
  container: document.getElementById('container')!,
  pdfSource: '/document.pdf',
  currentUser: {
    id: 'user123',
    name: 'John Doe',
    color: '#6C5CE7'
  }
});
```

### Text Files

```typescript
import { DocumentCommentViewer, DocumentType } from 'pdf-comment';
import 'pdf-comment/dist/styles.css';

const viewer = new DocumentCommentViewer({
  container: document.getElementById('container')!,
  document: {
    type: DocumentType.TEXT,
    source: 'const hello = "world";\nconsole.log(hello);'
  },
  currentUser: {
    id: 'user123',
    name: 'John Doe'
  }
});
```

### Word Documents

```typescript
import { DocumentCommentViewer, DocumentType } from 'pdf-comment';

const viewer = new DocumentCommentViewer({
  container: document.getElementById('container')!,
  document: {
    type: DocumentType.WORD,
    source: '/document.docx' // or File object
  },
  currentUser: {
    id: 'user123',
    name: 'John Doe'
  }
});
```

### Excel Spreadsheets

```typescript
import { DocumentCommentViewer, DocumentType } from 'pdf-comment';

const viewer = new DocumentCommentViewer({
  container: document.getElementById('container')!,
  document: {
    type: DocumentType.EXCEL,
    source: '/spreadsheet.xlsx' // or File object
  },
  currentUser: {
    id: 'user123',
    name: 'John Doe'
  }
});
```

## API Reference

### DocumentCommentViewer

Unified viewer for all document types (Text, Word, Excel).

#### Constructor Options

```typescript
interface BaseDocumentOptions {
  // Required
  container: HTMLElement;
  document: DocumentSource;

  // Optional
  initialComments?: Comment[];
  currentUser?: CommentAuthor;
  enableCommentCreation?: boolean; // default: true
  enableCommentEditing?: boolean;  // default: true
  enableReplies?: boolean;         // default: true
  theme?: CommentTheme;

  // Event callbacks
  onCommentCreated?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentResolved?: (commentId: string, resolved: boolean) => void;
}

type DocumentSource =
  | { type: DocumentType.PDF; source: string | ArrayBuffer | Uint8Array }
  | { type: DocumentType.TEXT; source: string | File }
  | { type: DocumentType.WORD; source: string | ArrayBuffer | File }
  | { type: DocumentType.EXCEL; source: string | ArrayBuffer | File };
```

#### Methods

```typescript
// Add a comment programmatically
addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'replies' | 'resolved'>): Comment

// Get all comments
getComments(): Comment[]

// Update a comment
updateComment(commentId: string, updates: Partial<Comment>): Comment | null

// Delete a comment
deleteComment(commentId: string): boolean

// Toggle comment resolved status
toggleResolveComment(commentId: string): Comment | null

// Navigation
zoomIn(): void
zoomOut(): void
goToComment(commentId: string): void

// Get document type
getDocumentType(): DocumentType

// Cleanup
destroy(): void
```

### PdfCommentViewer

Specialized viewer for PDF documents (backward compatible).

```typescript
interface PdfCommentOptions {
  container: HTMLElement;
  pdfSource: string | ArrayBuffer | Uint8Array;
  // ... same optional fields as BaseDocumentOptions
}
```

### Types

#### Comment Positions

Different document types use different position systems:

```typescript
// PDF Position
interface PdfPosition {
  type: DocumentType.PDF;
  page: number;  // 0-indexed
  x: number;     // 0-1 (relative)
  y: number;     // 0-1 (relative)
}

// Text Position
interface TextPosition {
  type: DocumentType.TEXT;
  line: number;    // 1-indexed
  column: number;  // 0-indexed
}

// Word Position
interface WordPosition {
  type: DocumentType.WORD;
  page: number;     // 0-indexed
  x: number;        // 0-1 (relative)
  y: number;        // 0-1 (relative)
  paragraph?: number;
}

// Excel Position
interface ExcelPosition {
  type: DocumentType.EXCEL;
  sheet: string | number;
  row: number;           // 1-indexed
  column: number | string; // 1-indexed or 'A', 'B', etc.
}

// Union type
type CommentPosition = PdfPosition | TextPosition | WordPosition | ExcelPosition;
```

#### Comment Object

```typescript
interface Comment {
  id: string;
  content: string;
  author: CommentAuthor;
  position: CommentPosition;
  rect?: CommentRect;         // For PDF/Word
  textRange?: TextRange;      // For text files
  cellRange?: CellRange;      // For Excel
  highlightedText?: string;
  createdAt: Date;
  updatedAt?: Date;
  replies: CommentReply[];
  resolved: boolean;
  tags?: string[];
}
```

## Examples

### File Upload with Comment Viewer

```typescript
import { DocumentCommentViewer, DocumentType } from 'pdf-comment';

// Handle file upload
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const extension = file.name.split('.').pop().toLowerCase();

  let documentType: DocumentType;
  switch (extension) {
    case 'pdf':
      documentType = DocumentType.PDF;
      break;
    case 'txt':
    case 'js':
    case 'ts':
      documentType = DocumentType.TEXT;
      break;
    case 'docx':
      documentType = DocumentType.WORD;
      break;
    case 'xlsx':
      documentType = DocumentType.EXCEL;
      break;
    default:
      throw new Error('Unsupported file type');
  }

  const viewer = new DocumentCommentViewer({
    container: document.getElementById('container')!,
    document: {
      type: documentType,
      source: file
    },
    currentUser: {
      id: 'user123',
      name: 'Current User'
    },
    onCommentCreated: async (comment) => {
      // Save to backend
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment)
      });
    }
  });
});
```

### Working with Text Files

```typescript
import { DocumentCommentViewer, DocumentType, TextPosition } from 'pdf-comment';

const viewer = new DocumentCommentViewer({
  container: document.getElementById('container')!,
  document: {
    type: DocumentType.TEXT,
    source: `function hello() {
  console.log("Hello, world!");
}

hello();`
  },
  currentUser: { id: '1', name: 'Developer' }
});

// Add a comment to a specific line
viewer.addComment({
  content: 'This function could be more descriptive',
  author: { id: '1', name: 'Developer' },
  position: {
    type: DocumentType.TEXT,
    line: 1,
    column: 0
  }
});
```

### Working with Excel

```typescript
import { DocumentCommentViewer, DocumentType, ExcelPosition } from 'pdf-comment';

const viewer = new DocumentCommentViewer({
  container: document.getElementById('container')!,
  document: {
    type: DocumentType.EXCEL,
    source: '/data.xlsx'
  }
});

// Add a comment to a specific cell
viewer.addComment({
  content: 'This value looks incorrect',
  author: { id: '1', name: 'Reviewer' },
  position: {
    type: DocumentType.EXCEL,
    sheet: 0,  // or sheet name
    row: 5,
    column: 'B'  // or column number
  }
});
```

## Customization

### Theming

```typescript
const viewer = new DocumentCommentViewer({
  container: document.getElementById('container')!,
  document: { type: DocumentType.TEXT, source: 'content' },
  theme: {
    primaryColor: '#FF6B6B',
    secondaryColor: '#4ECDC4',
    commentBackground: '#FFFFFF',
    textColor: '#2D3436',
    borderColor: '#DFE6E9'
  }
});
```

### CSS Variables

```css
:root {
  --pdf-comment-primary: #6C5CE7;
  --pdf-comment-secondary: #A29BFE;
  --pdf-comment-success: #00B894;
  --pdf-comment-text: #2D3436;
  --pdf-comment-border: #DFE6E9;
}
```

## Events

```typescript
import { CommentEventType } from 'pdf-comment';

viewer.commentManager.on(CommentEventType.CREATED, (event) => {
  console.log('Comment created:', event.comment);
});

viewer.commentManager.on(CommentEventType.RESOLVED, (event) => {
  console.log('Comment resolved:', event.comment);
});
```

### Available Events

- `CommentEventType.CREATED` - Comment created
- `CommentEventType.UPDATED` - Comment updated
- `CommentEventType.DELETED` - Comment deleted
- `CommentEventType.RESOLVED` - Comment resolved/unresolved
- `CommentEventType.REPLY_ADDED` - Reply added
- `CommentEventType.REPLY_UPDATED` - Reply updated
- `CommentEventType.REPLY_DELETED` - Reply deleted
- `CommentEventType.SELECTED` - Comment selected

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the library
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Testing

```bash
npm test -- --coverage
```

## Future Enhancements

For production use with Word and Excel documents, consider integrating:
- **Word**: [mammoth.js](https://github.com/mwilliamson/mammoth.js) for better DOCX parsing
- **Excel**: [SheetJS](https://sheetjs.com/) for comprehensive Excel support

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with [PDF.js](https://mozilla.github.io/pdf.js/) for PDF support
- Inspired by modern collaborative document tools like Google Docs, Notion, and Figma
