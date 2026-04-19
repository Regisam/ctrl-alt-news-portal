import { useMemo } from 'react';
import { ConnectionState } from '@shared/websocket-types';
import { Wifi, WifiOff, Loader } from 'lucide-react';

interface WebSocketStatusProps {
  state: ConnectionState;
  className?: string;
}

export function WebSocketStatus({ state, className = '' }: WebSocketStatusProps) {
  // Determine visibility based on connection state
  const visible = useMemo(() => {
    // Show when disconnected or connecting, hide when connected (stable)
    if (state.isConnecting) return true;
    if (!state.isConnected) return true;
    return false;
  }, [state.isConnected, state.isConnecting]);

  if (!visible && state.isConnected) {
    return null;
  }

  const statusConfig = {
    connected: {
      icon: Wifi,
      label: 'Live',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    connecting: {
      icon: Loader,
      label: 'Connecting...',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    disconnected: {
      icon: WifiOff,
      label: state.connectionError === 'auth_expired' ? 'Session expired' : 'Offline',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  };

  const config =
    state.isConnecting || state.isConnected
      ? state.isConnecting
        ? statusConfig.connecting
        : statusConfig.connected
      : statusConfig.disconnected;

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${config.bgColor} ${className}`}>
      <Icon className={`h-4 w-4 ${config.color} ${state.isConnecting ? 'animate-spin' : ''}`} />
      <span className={config.color}>{config.label}</span>
    </div>
  );
}
