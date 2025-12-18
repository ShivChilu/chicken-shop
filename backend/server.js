import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import routes
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import ordersRouter, { setSocketIO } from './routes/orders.js';
import pincodesRouter from './routes/pincodes.js';
import adminRouter from './routes/admin.js';
import uploadRouter from './routes/upload.js';
import initDataRouter from './routes/initData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// dotenv won't override existing env vars (like those set by Render)
dotenv.config({ path: path.join(__dirname, '.env') });

// Log environment configuration at startup
console.log('=== Environment Configuration ===');
console.log('ADMIN_PIN configured:', !!process.env.ADMIN_PIN);
console.log('MONGO_URL configured:', !!process.env.MONGO_URL);
console.log('DB_NAME:', process.env.DB_NAME || 'not set');
console.log('================================');

// Create Express app
const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Pass Socket.IO to orders router
setSocketIO(io);

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} - ${req.path}`);
  next();
});

// Static files for uploads
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Fresh Meat Hub API' });
});

app.use('/api/admin', adminRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/pincodes', pincodesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/init-data', initDataRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ detail: err.message || 'Internal server error' });
});

// Connect to MongoDB and start server
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'test_database';
const PORT = 8001;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(`${MONGO_URL}/${DB_NAME}`);
    console.log('Connected to MongoDB');
    
    // Start HTTP server
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
