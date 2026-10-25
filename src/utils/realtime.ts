import { useEffect, useRef } from 'react';

type RealtimeCallback = (data: any) => void;

class RealtimeManager {
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private listeners: Map<string, Set<RealtimeCallback>> = new Map();
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 20;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private seenEventIds: Set<string> = new Set();
  public isConnected: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  // Connect via both WebSocket (Primary) and SSE (Fail-safe backup)
  public connect() {
    if (this.isConnecting || typeof window === 'undefined') return;
    this.isConnecting = true;

    this.connectWebSocket();
    this.connectSSE();
  }

  private connectWebSocket() {
    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connection', { status: 'connected', transport: 'websocket' });

        // Send admin authentication if token exists
        try {
          const adminToken = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('bongoweb_admin_token') : null) ||
                             (typeof localStorage !== 'undefined' ? localStorage.getItem('bongoweb_admin_token') : null);
          if (adminToken && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'auth:admin', token: adminToken }));
          }
        } catch (_) {}

        // Heartbeat ping every 20 seconds
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingEvent(data, 'websocket');
        } catch (e) {
          console.error('[Realtime WS] Parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.isConnecting = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.emit('connection', { status: 'disconnected', transport: 'websocket' });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[Realtime WS] Socket error, falling back to SSE:', err);
        try {
          this.ws?.close();
        } catch (_) {}
      };
    } catch (e) {
      console.warn('[Realtime WS] Initialization failed, relying on SSE:', e);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private connectSSE() {
    if (typeof EventSource === 'undefined') return;
    if (this.sse) {
      try {
        this.sse.close();
      } catch (_) {}
    }

    try {
      this.sse = new EventSource('/api/events');

      this.sse.onmessage = (event) => {
        try {
          if (!event.data || event.data.startsWith(':')) return; // ignore comments/heartbeats
          const data = JSON.parse(event.data);
          this.handleIncomingEvent(data, 'sse');
        } catch (e) {
          // ignore keep-alive
        }
      };

      this.sse.onerror = () => {
        // EventSource automatically retries HTTP connections
      };
    } catch (e) {
      console.warn('[Realtime SSE] Error creating EventSource:', e);
    }
  }

  // Idempotent event dispatcher: prevents duplicate execution across WS and SSE channels
  private handleIncomingEvent(payload: any, transport: 'websocket' | 'sse') {
    if (!payload || !payload.type) return;

    // Deduplication check using unique payload key or timestamp
    let dedupeKey = '';
    if (payload.type === 'order:created' && payload.order?.orderId) {
      dedupeKey = `order:${payload.order.orderId}`;
    } else if (payload.type === 'chat:message' && payload.message?.id) {
      dedupeKey = `chat:${payload.message.id}`;
    } else if (payload.type === 'chat:activated' && payload.thread?.userPhone) {
      dedupeKey = `act:${payload.thread.userPhone}:${payload.timestamp}`;
    } else if (payload.type === 'chat:ended') {
      dedupeKey = `end:${payload.phone}:${payload.timestamp}`;
    } else if (payload.timestamp) {
      dedupeKey = `${payload.type}:${payload.timestamp}`;
    }

    if (dedupeKey) {
      if (this.seenEventIds.has(dedupeKey)) {
        return; // Skip duplicate message from redundant channel
      }
      this.seenEventIds.add(dedupeKey);
      // Keep seen set under 1000 items
      if (this.seenEventIds.size > 1000) {
        const arr = Array.from(this.seenEventIds);
        this.seenEventIds = new Set(arr.slice(arr.length - 500));
      }
    }

    // Trigger specific event listeners
    this.emit(payload.type, payload);
    // Also trigger wildcard listener
    this.emit('*', payload);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWebSocket();
    }, delay);
  }

  // Subscribe to real-time event
  public on(event: string, callback: RealtimeCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  // Unsubscribe from real-time event
  public off(event: string, callback?: RealtimeCallback) {
    if (!this.listeners.has(event)) return;
    if (callback) {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    } else {
      this.listeners.delete(event);
    }
  }

  // Emit event to subscribers
  public emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in realtime callback for ${event}:`, err);
        }
      });
    }
  }

  // Authenticate WebSocket connection as admin
  public authenticateAdmin(token: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'auth:admin', token }));
    }
  }

  // Send message over WebSocket if available, otherwise post to HTTP API
  public send(payload: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }
}

// Global Singleton Instance
export const realtimeManager = new RealtimeManager();

// React Hook for effortless real-time event listening
export function useRealtimeEvent(event: string, callback: (data: any) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = realtimeManager.on(event, (data) => {
      callbackRef.current(data);
    });
    return () => unsubscribe();
  }, [event]);
}
