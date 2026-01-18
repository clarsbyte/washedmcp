'use client';

// WebSocket Event Types
export type WSEventType =
  | 'mcp_added'
  | 'mcp_removed'
  | 'mcp_status_change'
  | 'context_added'
  | 'context_updated'
  | 'context_deleted'
  | 'member_joined'
  | 'member_removed'
  | 'member_activity'
  | 'sync_status_change'
  | 'freshness_changed';

export interface WSEvent {
  type: WSEventType;
  data: unknown;
  timestamp: string;
}

export type WSEventHandler = (event: WSEvent) => void;

// Connection state
export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'reconnecting';

// WebSocket manager
class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000; // 1 second
  private maxReconnectDelay = 30000; // 30 seconds
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Map<WSEventType | 'all', Set<WSEventHandler>> = new Map();
  private connectionStateHandlers: Set<(state: ConnectionState) => void> = new Set();
  private currentState: ConnectionState = 'disconnected';

  constructor(url?: string) {
    this.url = url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
  }

  /**
   * Connect to WebSocket server
   */
  connect(): WebSocket {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    this.setConnectionState('connecting');

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const wsEvent: WSEvent = JSON.parse(event.data);
        this.handleEvent(wsEvent);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.setConnectionState('disconnected');
      this.stopHeartbeat();
      this.scheduleReconnect();
    };

    return this.ws;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setConnectionState('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Send data through WebSocket
   */
  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send data');
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(eventType: WSEventType | 'all', handler: WSEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(handler: (state: ConnectionState) => void): () => void {
    this.connectionStateHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.connectionStateHandlers.delete(handler);
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.currentState;
  }

  /**
   * Handle incoming WebSocket events
   */
  private handleEvent(event: WSEvent): void {
    // Call type-specific handlers
    const typeHandlers = this.eventHandlers.get(event.type);
    if (typeHandlers) {
      typeHandlers.forEach((handler) => handler(event));
    }

    // Call "all" handlers
    const allHandlers = this.eventHandlers.get('all');
    if (allHandlers) {
      allHandlers.forEach((handler) => handler(event));
    }
  }

  /**
   * Set connection state and notify handlers
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.currentState !== state) {
      this.currentState = state;
      this.connectionStateHandlers.forEach((handler) => handler(state));
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.setConnectionState('reconnecting');

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

/**
 * Get WebSocket manager instance
 */
export function getWebSocketManager(): WebSocketManager {
  if (typeof window === 'undefined') {
    throw new Error('WebSocket can only be used in client-side code');
  }

  if (!wsManager) {
    wsManager = new WebSocketManager();
  }

  return wsManager;
}

/**
 * Connect to WebSocket server
 */
export function connectWebSocket(): WebSocket {
  return getWebSocketManager().connect();
}

/**
 * Disconnect from WebSocket server
 */
export function disconnectWebSocket(): void {
  getWebSocketManager().disconnect();
}

/**
 * Subscribe to WebSocket events
 */
export function onWebSocketEvent(
  eventType: WSEventType | 'all',
  handler: WSEventHandler
): () => void {
  return getWebSocketManager().on(eventType, handler);
}

/**
 * Subscribe to connection state changes
 */
export function onConnectionStateChange(
  handler: (state: ConnectionState) => void
): () => void {
  return getWebSocketManager().onConnectionStateChange(handler);
}

/**
 * Send data through WebSocket
 */
export function sendWebSocketMessage(data: unknown): void {
  getWebSocketManager().send(data);
}

/**
 * Get current connection state
 */
export function getConnectionState(): ConnectionState {
  return getWebSocketManager().getConnectionState();
}
