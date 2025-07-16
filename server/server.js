const express = require('express'); 
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const { socketHandler } = require('./utils/socketHandler'); // ✅ only once

dotenv.config();
const app = express();
const server = http.createServer(app);

// Allow client origin (Vite, localhost:5173)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Routes
const authRoutes = require('./routes/authRoutes.js');
const taskRoutes = require('./routes/taskRoutes');
const logRoutes = require('./routes/logRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/logs', logRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  socketHandler(socket, io);
});

// Connect DB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.error('❌ DB connection error:', err));
