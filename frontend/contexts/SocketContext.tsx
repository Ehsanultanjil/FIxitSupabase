import React, { createContext, useContext, useEffect, useState } from 'react';
// Socket.io removed - using Supabase serverless
// import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Socket = any; // Placeholder type

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinReport: (reportId: string) => void;
  leaveReport: (reportId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  joinReport: () => {},
  leaveReport: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Socket.io disabled - Using Supabase real-time instead
  // No backend server needed for Supabase serverless architecture
  useEffect(() => {
    console.log('� Using Supabase real-time (Socket.io disabled)');
    // Socket connection disabled to prevent APK crashes
    // If you need real-time updates, use Supabase Realtime subscriptions
  }, []);

  const joinReport = (reportId: string) => {
    if (socket && connected) {
      socket.emit('joinReport', reportId);
      console.log(`📍 Joining report room: ${reportId}`);
    }
  };

  const leaveReport = (reportId: string) => {
    if (socket && connected) {
      socket.emit('leaveReport', reportId);
      console.log(`👋 Leaving report room: ${reportId}`);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinReport, leaveReport }}>
      {children}
    </SocketContext.Provider>
  );
};
