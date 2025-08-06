import { io, Socket } from "socket.io-client";
import { SOCKET_IO_URL } from "./constants";

// Define the type for your socket instance
interface ClientToServerEvents {
  joinCustomerRoom: (userId: string) => void;
  joinVendorRoom: (vendorUserId: string) => void;
  // Add other client-to-server events here
}

interface ServerToClientEvents {
  orderStatusUpdate: (data: {
    orderId: string;
    newStatus: string;
    message: string;
  }) => void;
  newOrderNotification: (data: {
    orderId: string;
    message: string;
    itemsCount: number;
  }) => void;
  // Add other server-to-client events here
}

// Export a strongly typed socket instance
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  SOCKET_IO_URL,
  {
    autoConnect: false, // Control connections manually
  }
);
