import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
}

export const useSocket = (userId?: string): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) {
      console.log('No userId provided, skipping socket connection');
      return;
    }

    console.log('🔌 Initializing socket connection for user:', userId);

    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id, 'User:', userId);
      setIsConnected(true);
      
      // Join with user ID
      socket.emit('join', userId);
      console.log('📡 Emitted join event for:', userId);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      if (userId) {
        socket.emit('join', userId);
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Attempting to reconnect...', attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
    });

    // Receive initial online users list
    socket.on('online-users-list', (usersList: string[]) => {
      console.log('📊 Received online users list:', usersList);
      setOnlineUsers(new Set(usersList));
    });

    // Track online users status changes
    socket.on('user-status', ({ userId: onlineUserId, status }) => {
      console.log(`👤 User status update: ${onlineUserId} is ${status}`);
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        if (status === 'online') {
          updated.add(onlineUserId);
        } else {
          updated.delete(onlineUserId);
        }
        console.log('📊 Updated online users:', Array.from(updated));
        return updated;
      });
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('reconnect');
        socketRef.current.off('reconnect_attempt');
        socketRef.current.off('reconnect_error');
        socketRef.current.off('reconnect_failed');
        socketRef.current.off('user-status');
        socketRef.current.off('online-users-list');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers
  };
};
