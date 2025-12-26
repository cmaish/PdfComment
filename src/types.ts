/**
 * Document types supported by the library
 */
export enum DocumentType {
  PDF = 'pdf',
  TEXT = 'text',
  WORD = 'word',
  EXCEL = 'excel',
}

/**
 * Base position interface
 */
export interface BasePosition {
  /** Type of document */
  type: DocumentType;
}

/**
 * Position of a comment on a PDF page
 */
export interface PdfPosition extends BasePosition {
  type: DocumentType.PDF;
  /** Page number (0-indexed) */
  page: number;
  /** X coordinate (0-1, relative to page width) */
  x: number;
  /** Y coordinate (0-1, relative to page height) */
  y: number;
}

/**
 * Position of a comment in a text file
 */
export interface TextPosition extends BasePosition {
  type: DocumentType.TEXT;
  /** Line number (1-indexed) */
  line: number;
  /** Column/character position (0-indexed) */
  column: number;
}

/**
 * Position of a comment in a Word document
 */
export interface WordPosition extends BasePosition {
  type: DocumentType.WORD;
  /** Page number (0-indexed) */
  page: number;
  /** Paragraph index on the page (0-indexed) */
  paragraph?: number;
  /** X coordinate (0-1, relative to page width) */
  x: number;
  /** Y coordinate (0-1, relative to page height) */
  y: number;
}

/**
 * Position of a comment in an Excel spreadsheet
 */
export interface ExcelPosition extends BasePosition {
  type: DocumentType.EXCEL;
  /** Sheet name or index */
  sheet: string | number;
  /** Row number (1-indexed, like Excel) */
  row: number;
  /** Column (1-indexed or letter like 'A', 'B') */
  column: number | string;
}

/**
 * Union type for all position types
 */
export type CommentPosition = PdfPosition | TextPosition | WordPosition | ExcelPosition;

/**
 * Rectangle selection area (for PDF and Word)
 */
export interface CommentRect {
  /** Width (0-1, relative to page width) */
  width: number;
  /** Height (0-1, relative to page height) */
  height: number;
}

/**
 * Text range selection (for text files)
 */
export interface TextRange {
  /** Starting line */
  startLine: number;
  /** Starting column */
  startColumn: number;
  /** Ending line */
  endLine: number;
  /** Ending column */
  endColumn: number;
}

/**
 * Cell range selection (for Excel)
 */
export interface CellRange {
  /** Starting row */
  startRow: number;
  /** Starting column */
  startColumn: number | string;
  /** Ending row */
  endRow: number;
  /** Ending column */
  endColumn: number | string;
}

/**
 * Comment author information
 */
export interface CommentAuthor {
  /** Author's unique identifier */
  id: string;
  /** Author's display name */
  name: string;
  /** Author's avatar URL (optional) */
  avatarUrl?: string;
  /** Author's color for UI theming */
  color?: string;
}

/**
 * Reply to a comment
 */
export interface CommentReply {
  /** Unique identifier for the reply */
  id: string;
  /** Reply content */
  content: string;
  /** Reply author */
  author: CommentAuthor;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt?: Date;
}

/**
 * Main comment object
 */
export interface Comment {
  /** Unique identifier for the comment */
  id: string;
  /** Comment content (supports markdown) */
  content: string;
  /** Comment author */
  author: CommentAuthor;
  /** Comment position in document */
  position: CommentPosition;
  /** Optional highlight rectangle (for PDF/Word) */
  rect?: CommentRect;
  /** Optional text range (for text files) */
  textRange?: TextRange;
  /** Optional cell range (for Excel) */
  cellRange?: CellRange;
  /** Optional highlighted text */
  highlightedText?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt?: Date;
  /** Replies to this comment */
  replies: CommentReply[];
  /** Whether comment is resolved */
  resolved: boolean;
  /** Optional tags */
  tags?: string[];
}

/**
 * Comment event types
 */
export enum CommentEventType {
  CREATED = 'comment:created',
  UPDATED = 'comment:updated',
  DELETED = 'comment:deleted',
  RESOLVED = 'comment:resolved',
  REPLY_ADDED = 'comment:reply:added',
  REPLY_UPDATED = 'comment:reply:updated',
  REPLY_DELETED = 'comment:reply:deleted',
  SELECTED = 'comment:selected',
  DESELECTED = 'comment:deselected',
}

/**
 * Comment event payload
 */
export interface CommentEvent {
  type: CommentEventType;
  comment: Comment;
  reply?: CommentReply;
}

/**
 * Document source configuration
 */
export type DocumentSource =
  | { type: DocumentType.PDF; source: string | ArrayBuffer | Uint8Array }
  | { type: DocumentType.TEXT; source: string | File }
  | { type: DocumentType.WORD; source: string | ArrayBuffer | File }
  | { type: DocumentType.EXCEL; source: string | ArrayBuffer | File };

/**
 * Base configuration options for document viewers
 */
export interface BaseDocumentOptions {
  /** Container element for the viewer */
  container: HTMLElement;
  /** Document source */
  document: DocumentSource;
  /** Initial comments to display */
  initialComments?: Comment[];
  /** Current user information */
  currentUser?: CommentAuthor;
  /** Whether to enable adding new comments */
  enableCommentCreation?: boolean;
  /** Whether to enable editing comments */
  enableCommentEditing?: boolean;
  /** Whether to enable replying to comments */
  enableReplies?: boolean;
  /** Custom theme colors */
  theme?: CommentTheme;
  /** Event callbacks */
  onCommentCreated?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentResolved?: (commentId: string, resolved: boolean) => void;
}

/**
 * Configuration options for PdfCommentViewer (backward compatibility)
 */
export interface PdfCommentOptions {
  /** Container element for the PDF viewer */
  container: HTMLElement;
  /** PDF document URL or data */
  pdfSource: string | ArrayBuffer | Uint8Array;
  /** Initial comments to display */
  initialComments?: Comment[];
  /** Current user information */
  currentUser?: CommentAuthor;
  /** Whether to enable adding new comments */
  enableCommentCreation?: boolean;
  /** Whether to enable editing comments */
  enableCommentEditing?: boolean;
  /** Whether to enable replying to comments */
  enableReplies?: boolean;
  /** Custom theme colors */
  theme?: CommentTheme;
  /** Event callbacks */
  onCommentCreated?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentResolved?: (commentId: string, resolved: boolean) => void;
}

/**
 * Theme configuration for comment UI
 */
export interface CommentTheme {
  /** Primary color for UI elements */
  primaryColor?: string;
  /** Secondary color for UI elements */
  secondaryColor?: string;
  /** Background color for comment cards */
  commentBackground?: string;
  /** Text color */
  textColor?: string;
  /** Border color */
  borderColor?: string;
  /** Hover color */
  hoverColor?: string;
  /** Resolved comment color */
  resolvedColor?: string;
}
