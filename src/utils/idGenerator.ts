/**
 * Generate a unique ID for comments and replies
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a random color for user avatars
 */
export function generateColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#6C5CE7', '#A29BFE', '#FD79A8',
    '#FDCB6E', '#6C5CE7', '#00B894', '#0984E3'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
