import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { CommentMessage, ConnectionState } from '@shared/websocket-types';

export interface UseCommentStreamOptions {
  articleId: string;
  token: string;
  enabled?: boolean;
  onCommentEvent?: (message: CommentMessage) => void;
  onConnectionChange?: (state: ConnectionState) => void;
}

export function useCommentStream({
  articleId,
  token,
  enabled = true,
  onCommentEvent,
  onConnectionChange,
}: UseCommentStreamOptions) {
  const socketRef = useRef<Socket | null>(null);
  const stateRef = useRef<ConnectionState>({
    isConnected: false,
    isConnecting: false,
  });
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
  });
  const maxReconnectAttempts = 5;
  const baseBackoffMs = 1000;

  const updateConnectionState = useCallback((state: Partial<ConnectionState>) => {
    const newState = { ...stateRef.current, ...state };
    stateRef.current = newState;
    setConnectionState(newState);
    onConnectionChange?.(newState);
  }, [onConnectionChange]);

  const setupSocket = useCallback(() => {
    if (!token || socketRef.current?.connected) return;

    const socket = io(window.location.origin, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: baseBackoffMs,
      reconnectionDelayMax: 8000,
      reconnectionAttempts: maxReconnectAttempts,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      updateConnectionState({
        isConnected: true,
        isConnecting: false,
        connectionError: undefined,
        lastHeartbeat: Date.now(),
      });
      socket.emit('join_article', articleId);
    });

    socket.on('disconnect', (reason) => {
      updateConnectionState({
        isConnected: false,
        isConnecting: false,
        connectionError: reason,
      });
    });

    socket.on('comment_event', (message: CommentMessage) => {
      onCommentEvent?.(message);
    });

    socket.on('pong', (payload: { timestamp: number }) => {
      updateConnectionState({ lastHeartbeat: payload.timestamp });
    });

    socket.on('error', (error: string | Error) => {
      updateConnectionState({
        isConnected: false,
        isConnecting: false,
        connectionError: String(error),
      });
    });

    socket.on('auth_expired', () => {
      updateConnectionState({ connectionError: 'auth_expired' });
    });

    socketRef.current = socket;
    updateConnectionState({ isConnecting: true });
  }, [token, articleId, updateConnectionState, onCommentEvent]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      updateConnectionState({ isConnected: false, isConnecting: false });
    }
  }, [updateConnectionState]);

  const sendOptimisticUpdate = useCallback(
    (eventType: string, payload: Record<string, unknown>) => {
      if (!socketRef.current?.connected) {
        return;
      }

      const clientTimestamp = Date.now();
      socketRef.current.emit(eventType, {
        ...payload,
        clientTimestamp,
        articleId,
      });
    },
    [articleId]
  );

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    setupSocket();

    return () => {
      disconnect();
    };
  }, [enabled, setupSocket, disconnect]);

  // Heartbeat ping every 30 seconds
  useEffect(() => {
    if (!socketRef.current?.connected) return;

    const heartbeatInterval = setInterval(() => {
      socketRef.current?.emit('ping');
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, []);

  return {
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    connectionError: connectionState.connectionError,
    lastHeartbeat: connectionState.lastHeartbeat,
    sendOptimisticUpdate,
  };
}
