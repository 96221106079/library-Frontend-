import { io } from "socket.io-client";

// Singleton socket instance
const SOCKET_URL = "http://localhost:5000";
export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};
