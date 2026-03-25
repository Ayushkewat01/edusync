import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

let socket = null;

export default function useSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token && !socket) {
      socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        setConnected(true);
      });
      socket.on('disconnect', () => {
        setConnected(false);
      });
    }
  }, [isAuthenticated, token]);

  const joinClass = useCallback((classId) => {
    if (socket && connected) {
      socket.emit('join-class', classId);
    }
  }, [connected]);

  const leaveClass = useCallback((classId) => {
    if (socket && connected) {
      socket.emit('leave-class', classId);
    }
  }, [connected]);

  return { socket, connected, joinClass, leaveClass };
}
