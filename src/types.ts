/**
 * Position of a comment on a PDF page
 */
export interface CommentPosition {
  /** Page number (0-indexed) */
  page: number;
  /** X coordinate (0-1, relative to page width) */
  x: number;
  /** Y coordinate (0-1, relative to page height) */
  y: number;
}

/**
 * Rectangle selection area on a PDF page
 */
export interface CommentRect extends CommentPosition {
  /** Width (0-1, relative to page width) */
  width: number;
  /** Height (0-1, relative to page height) */
  height: number;
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
  /** Comment position on page */
  position: CommentPosition;
  /** Optional highlight rectangle */
  rect?: CommentRect;
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
 * Configuration options for PdfCommentViewer
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
