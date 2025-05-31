import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL;

export function useSocketMatch(onMatchFound: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect once when component mounts
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.on('connect', () => {
      console.log('Socket connected ✅');
    });

    socketRef.current.on('quickMatchFound', (data) => {
      console.log('🔔 Match Found:', data);
      onMatchFound(data);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendDestination = (destination: string) => {
    socketRef.current?.emit('findQuickMatch', { destination });
  };

  return { sendDestination };
}
