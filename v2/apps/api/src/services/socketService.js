let io = null;

export const setIo = (socketIo) => {
  io = socketIo;
};

export const getIo = () => io;

export const emitOrderTracking = (orderId, payload) => {
  if (!io) return;
  io.to(`order:${orderId}`).emit("order:tracking:update", payload);
};
