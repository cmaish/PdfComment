/**
 * Simple event emitter for comment events
 */
export class EventEmitter<T = unknown> {
  private listeners: Map<string, Set<(data: T) => void>> = new Map();

  /**
   * Subscribe to an event
   */
  public on(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Unsubscribe from an event
   */
  public off(event: string, callback: (data: T) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Emit an event
   */
  public emit(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  /**
   * Remove all listeners
   */
  public clear(): void {
    this.listeners.clear();
  }
}
