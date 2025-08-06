import "dotenv/config";
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

import { PORT } from "./config";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import vendorRoutes from "./routes/vendorRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";

export const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());

app.set("io", io); // Make io instance available to controllers

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // A client (customer) joins their personal room for order updates
  socket.on("joinCustomerRoom", (userId: string) => {
    socket.join(`customer_user_${userId}`);
    console.log(
      `Socket ${socket.id} joined customer room: customer_user_${userId}`
    );
  });

  // A client (vendor) joins their personal room for new order notifications
  socket.on("joinVendorRoom", (vendorUserId: string) => {
    // Now based on vendor's User ID
    socket.join(`vendor_user_${vendorUserId}`);
    console.log(
      `Socket ${socket.id} joined vendor room: vendor_user_${vendorUserId}`
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("FreshMart API is running!");
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
      message: err.message || "An unexpected error occurred.",
      errors: err.errors,
    });
  }
);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Prisma disconnected, server shutting down.");
  process.exit(0);
});
