import React, { createContext, useContext } from 'react';

interface SocketContextType {
  socket: null;
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
  const joinReport = (reportId: string) => {};
  const leaveReport = (reportId: string) => {};

  return (
    <SocketContext.Provider value={{ socket: null, connected: false, joinReport, leaveReport }}>
      {children}
    </SocketContext.Provider>
  );
};
