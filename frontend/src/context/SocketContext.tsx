'use client';

/**
 * Socket Context Provider
 * Manages Socket.io connection for real-time updates
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ToastProvider';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinQueue: (queueId: number) => void;
  leaveQueue: (queueId: number) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinQueue: () => {},
  leaveQueue: () => {},
});

function resolveSocketUrl() {
  const envBase = process.env.NEXT_PUBLIC_SOCKET_URL;
  const baseFromEnv = envBase;

  // During SSR, avoid reading `window` (prevents server/client rendering mismatches).
  if (typeof window === 'undefined') return baseFromEnv as string | undefined;

  if (!baseFromEnv) {
    // Fail fast: Socket.io server must be configured (dev + prod).
    throw new Error('NEXT_PUBLIC_SOCKET_URL must be set (e.g. http://127.0.0.1:5000 for dev, https://<render> for prod).');
  }

  const host = window.location.hostname;
  const isClientLocal =
    host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '0.0.0.0';

  const envLooksLikeLocalhost =
    (baseFromEnv as string).includes('localhost:5000') ||
    (baseFromEnv as string).includes('127.0.0.1:5000') ||
    (baseFromEnv as string).includes('0.0.0.0:5000');

  // If the frontend is opened via LAN IP, but env points to localhost, swap to the LAN host.
  if (!isClientLocal && envLooksLikeLocalhost) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return baseFromEnv as string;
}

/** Request browser notification permission once on mount */
function requestBrowserNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

/** Show a browser-level push notification (works when tab is hidden) */
function showBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch (_) {}
  }
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  // Keep a stable ref so socket event handlers don't capture stale closures
  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  useEffect(() => {
    requestBrowserNotificationPermission();
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const socketUrl = resolveSocketUrl();
    const newSocket = io(socketUrl || undefined, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      // Prevent excessive retry loops from degrading the browser/CPU when the backend is unreachable.
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', () => {
      // Intentionally quiet to avoid confusing users with transient dev-time failures.
      // Components should rely on API calls for core functionality.
    });

    // ── Pre-Call Notification ──────────────────────────────────────────────
    // Fired by backend when a user's estimated wait drops to ≤10 minutes.
    newSocket.on('pre_call_notification', (data: { tokenNumber: string; message: string }) => {
      const msg = data?.message || `⚡ Your turn for token ${data?.tokenNumber} is coming soon!`;
      showToastRef.current(msg, 'warning');
      showBrowserNotification('⚡ Your Turn Is Near!', msg);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, user?.role]);

  const joinQueue = (queueId: number) => {
    if (socket) {
      socket.emit('join-queue', { queueId });
    }
  };

  const leaveQueue = (queueId: number) => {
    if (socket) {
      socket.emit('leave-queue', { queueId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinQueue, leaveQueue }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
