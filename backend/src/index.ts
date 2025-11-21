import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import schemaRoutes from "./routes/schema";
import dataRoutes from "./routes/data";
import systemRoutes from "./routes/system";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import roleRoutes from "./routes/role";
import dashboardRoutes from "./routes/dashboard";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 将 io 实例挂载到 app 上，供其他模块使用
app.set("io", io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/schemas", schemaRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/systems", systemRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Socket.IO 连接处理
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // 加入系统房间
  socket.on("join-system", (systemId: string) => {
    socket.join(`system:${systemId}`);
    console.log(`Socket ${socket.id} joined system:${systemId}`);
  });

  // 离开系统房间
  socket.on("leave-system", (systemId: string) => {
    socket.leave(`system:${systemId}`);
    console.log(`Socket ${socket.id} left system:${systemId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// 导出广播函数供其他模块使用
export const broadcastToSystem = (systemId: string, event: string, data: any) => {
  io.to(`system:${systemId}`).emit(event, data);
};

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// Start server
const server = httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
