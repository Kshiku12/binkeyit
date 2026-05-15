import { Server } from "socket.io";
import { setIo } from "./services/socketService.js";

export const attachSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "*"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("order:join", ({ orderId }) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
    });

    socket.on("order:leave", ({ orderId }) => {
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });
  });

  setIo(io);
  return io;
};
