// Main exports
export { PdfCommentViewer } from './core/PdfCommentViewer';
export { DocumentCommentViewer } from './core/DocumentCommentViewer';
export { CommentManager } from './core/CommentManager';

// Renderer exports
export { BaseDocumentRenderer } from './renderers/BaseDocumentRenderer';
export { TextDocumentRenderer } from './renderers/TextDocumentRenderer';
export { WordDocumentRenderer } from './renderers/WordDocumentRenderer';
export { ExcelDocumentRenderer } from './renderers/ExcelDocumentRenderer';

// Type exports
export type {
  Comment,
  CommentAuthor,
  CommentPosition,
  PdfPosition,
  TextPosition,
  WordPosition,
  ExcelPosition,
  CommentRect,
  TextRange,
  CellRange,
  CommentReply,
  CommentEvent,
  PdfCommentOptions,
  BaseDocumentOptions,
  DocumentSource,
  CommentTheme,
} from './types';

export { CommentEventType, DocumentType } from './types';

// Utility exports
export { generateId, generateColor } from './utils/idGenerator';

// Import styles
import './styles/main.css';
