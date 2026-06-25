import { useEffect, useRef, useState, useCallback } from 'react';

// AC1-7: WebSocket hook
export interface UseSocketOptions {
  url?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  fallbackToPoll?: boolean;
  pollInterval?: number;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    url = typeof window !== 'undefined' ? `${window.location.protocol.replace('http', 'ws')}//${window.location.host}` : '',
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    fallbackToPoll = true,
    pollInterval = 30000,
  } = options;

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [usePolling, setUsePolling] = useState(false);
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());

  // AC1: Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current) return;

    try {
      socketRef.current = new WebSocket(url);

      socketRef.current.onopen = () => {
        console.log('✓ WebSocket connected');
        setIsConnected(true);
        reconnectCountRef.current = 0;
      };

      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, payload } = message;

          // AC9: Emit to subscribers
          const listeners = listenersRef.current.get(type);
          if (listeners) {
            listeners.forEach((listener) => listener(payload));
          }

          // Emit to 'all' listeners
          const allListeners = listenersRef.current.get('*');
          if (allListeners) {
            allListeners.forEach((listener) => listener(message));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message', error);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error', error);
      };

      socketRef.current.onclose = () => {
        console.log('✗ WebSocket disconnected');
        setIsConnected(false);
        socketRef.current = null;

        // AC7: Auto-reconnect
        if (reconnect && reconnectCountRef.current < maxReconnectAttempts) {
          reconnectCountRef.current++;
          console.log(`Reconnecting (attempt ${reconnectCountRef.current}/${maxReconnectAttempts})...`);

          setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (fallbackToPoll) {
          // AC6: Fallback to polling
          console.log('WebSocket failed, falling back to polling');
          setUsePolling(true);
          startPolling();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket', error);

      if (fallbackToPoll) {
        setUsePolling(true);
        startPolling();
      }
    }
  }, [url, reconnect, reconnectInterval, maxReconnectAttempts, fallbackToPoll]);

  // AC6: Polling fallback
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;

    pollIntervalRef.current = setInterval(() => {
      // AC6: Fetch notifications via HTTP
      fetch('/api/notifications?unread=true')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.notifications) {
            const listeners = listenersRef.current.get('notifications');
            if (listeners) {
              listeners.forEach((listener) => listener(data.data.notifications));
            }
          }
        })
        .catch((error) => console.error('Polling error', error));
    }, pollInterval);
  }, [pollInterval]);

  // AC6: Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // AC2: Disconnect
  const disconnect = useCallback(() => {
    stopPolling();

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsConnected(false);
  }, [stopPolling]);

  // AC9: Subscribe to events
  const on = useCallback((eventType: string, listener: Function) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }

    listenersRef.current.get(eventType)!.add(listener);

    // Send subscription to server (if connected)
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'subscribe', payload: { eventType } }));
    }
  }, []);

  // AC9: Unsubscribe from events
  const off = useCallback((eventType: string, listener: Function) => {
    const listeners = listenersRef.current.get(eventType);

    if (listeners) {
      listeners.delete(listener);
    }

    // Send unsubscription to server (if connected)
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'unsubscribe', payload: { eventType } }));
    }
  }, []);

  // AC11: Send event
  const emit = useCallback((eventType: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: eventType, payload }));
    } else {
      console.warn('WebSocket not connected, cannot emit event');
    }
  }, []);

  // AC1: Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    usePolling,
    on,
    off,
    emit,
    disconnect,
  };
}
