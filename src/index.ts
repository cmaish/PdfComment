// Main exports
export { PdfCommentViewer } from './core/PdfCommentViewer';
export { CommentManager } from './core/CommentManager';

// Type exports
export type {
  Comment,
  CommentAuthor,
  CommentPosition,
  CommentRect,
  CommentReply,
  CommentEvent,
  PdfCommentOptions,
  CommentTheme,
} from './types';

export { CommentEventType } from './types';

// Utility exports
export { generateId, generateColor } from './utils/idGenerator';

// Import styles
import './styles/main.css';
