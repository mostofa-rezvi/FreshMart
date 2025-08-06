import 'dotenv/config'; // Load environment variables at the very beginning
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import { authenticateToken } from "./middleware/authMiddleware";

import { PORT } from './config';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import vendorRoutes from './routes/vendorRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';

// Initialize Prisma Client
export const prisma = new PrismaClient();

const app = express();

// Apply authentication middleware globally after app is defined
app.use(authenticateToken);
const server = http.createServer(app); // Create HTTP server for Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Allow all origins for development, specify your frontend origin in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Socket.io integration
// Make io instance available throughout the application
app.set('io', io);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Example: Join a vendor's specific room for order updates
  // In a real app, this would be authenticated and authorized
  socket.on('joinVendorRoom', (vendorId: string) => {
    socket.join(`vendor_${vendorId}`);
    console.log(`Socket ${socket.id} joined vendor room: vendor_${vendorId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.get('/', (req, res) => {
  res.send('FreshMart API is running!');
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Error handling middleware (optional, but good practice)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'An unexpected error occurred.',
    errors: err.errors, // If validation errors
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected, server shutting down.');
  process.exit(0);
});