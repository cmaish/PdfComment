# PDF Comment Library

A beautiful, TypeScript-based library for adding and displaying comments on PDF files in the browser. Built as an extension of PDF.js with an elegant and intuitive user interface.

## Features

- **PDF Rendering**: Powered by PDF.js for reliable PDF display
- **Interactive Comments**: Click anywhere on a PDF to add comments
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

## Installation

```bash
npm install pdf-comment
```

## Quick Start

```typescript
import { PdfCommentViewer } from 'pdf-comment';
import 'pdf-comment/dist/styles.css';

const viewer = new PdfCommentViewer({
  container: document.getElementById('pdf-container')!,
  pdfSource: '/path/to/document.pdf',
  currentUser: {
    id: 'user123',
    name: 'John Doe',
    color: '#6C5CE7'
  },
  onCommentCreated: (comment) => {
    console.log('New comment:', comment);
  }
});
```

## HTML Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF Comment Viewer</title>
  <link rel="stylesheet" href="node_modules/pdf-comment/dist/styles.css">
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #pdf-container {
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="pdf-container"></div>
  <script type="module">
    import { PdfCommentViewer } from './dist/index.esm.js';

    const viewer = new PdfCommentViewer({
      container: document.getElementById('pdf-container'),
      pdfSource: './sample.pdf',
      currentUser: {
        id: 'user1',
        name: 'Demo User',
        color: '#6C5CE7'
      }
    });
  </script>
</body>
</html>
```

## API Reference

### PdfCommentViewer

Main class for creating a PDF viewer with commenting functionality.

#### Constructor Options

```typescript
interface PdfCommentOptions {
  // Required
  container: HTMLElement;
  pdfSource: string | ArrayBuffer | Uint8Array;

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
```

#### Methods

```typescript
// Add a comment programmatically
addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'replies' | 'resolved'>): Comment

// Get all comments
getComments(): Comment[]

// Get comments for a specific page
getCommentsForPage(page: number): Comment[]

// Update a comment
updateComment(commentId: string, updates: Partial<Comment>): Comment | null

// Delete a comment
deleteComment(commentId: string): boolean

// Toggle comment resolved status
toggleResolveComment(commentId: string): Comment | null

// Navigation
zoomIn(): void
zoomOut(): void
goToPage(pageNumber: number): void

// Cleanup
destroy(): void
```

### Types

#### Comment

```typescript
interface Comment {
  id: string;
  content: string;
  author: CommentAuthor;
  position: CommentPosition;
  rect?: CommentRect;
  highlightedText?: string;
  createdAt: Date;
  updatedAt?: Date;
  replies: CommentReply[];
  resolved: boolean;
  tags?: string[];
}
```

#### CommentAuthor

```typescript
interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  color?: string;
}
```

#### CommentPosition

```typescript
interface CommentPosition {
  page: number;  // 0-indexed
  x: number;     // 0-1 (relative to page width)
  y: number;     // 0-1 (relative to page height)
}
```

## Customization

### Theming

Customize the appearance to match your brand:

```typescript
const viewer = new PdfCommentViewer({
  container: document.getElementById('pdf-container')!,
  pdfSource: '/document.pdf',
  theme: {
    primaryColor: '#FF6B6B',
    secondaryColor: '#4ECDC4',
    commentBackground: '#FFFFFF',
    textColor: '#2D3436',
    borderColor: '#DFE6E9',
    hoverColor: '#F8F9FA',
    resolvedColor: '#00B894'
  }
});
```

### CSS Variables

You can also override CSS variables:

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

Subscribe to comment events for custom behavior:

```typescript
import { CommentEventType } from 'pdf-comment';

viewer.commentManager.on(CommentEventType.CREATED, (event) => {
  console.log('Comment created:', event.comment);
  // Save to backend
  saveCommentToServer(event.comment);
});

viewer.commentManager.on(CommentEventType.RESOLVED, (event) => {
  console.log('Comment resolved:', event.comment);
  // Send notification
  notifyCommentAuthor(event.comment);
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

## Advanced Usage

### Loading Comments from Backend

```typescript
// Fetch existing comments
const existingComments = await fetch('/api/comments').then(r => r.json());

const viewer = new PdfCommentViewer({
  container: document.getElementById('pdf-container')!,
  pdfSource: '/document.pdf',
  initialComments: existingComments,
  onCommentCreated: async (comment) => {
    // Save new comment to backend
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    });
  }
});
```

### Working with Comment Manager Directly

```typescript
// Access the comment manager
const manager = viewer.commentManager;

// Add a comment
const comment = manager.addComment({
  content: 'This needs review',
  author: { id: '1', name: 'John' },
  position: { page: 0, x: 0.5, y: 0.5 }
});

// Add a reply
manager.addReply(comment.id, {
  content: 'I agree!',
  author: { id: '2', name: 'Jane' }
});

// Resolve the comment
manager.toggleResolve(comment.id);
```

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

# Run tests in watch mode
npm run test:watch

# Build the library
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Testing

The library includes comprehensive tests:

```bash
npm test -- --coverage
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with [PDF.js](https://mozilla.github.io/pdf.js/)
- Inspired by modern collaborative document tools
