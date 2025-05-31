// backend/server.js

// Imports
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
require('dotenv').config(); // Load environment variables

// Database connection
const connectDB = require('./config/db');

// Socket initialization
const initializeSocket = require('./sockets');

// Route imports
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const rideRoutes = require('./routes/rideRoutes');
const distanceRoutes = require('./routes/distanceRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Initialize Express App
const app = express();

// Middleware: Enable CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://split-ride-5d42.vercel.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Optional: If you’re using cookies or HTTP auth
  })
);

// Middleware: Parse JSON and static files
app.use(bodyParser.json());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to the database
connectDB();

// API Routes
app.use('/api/users', userRoutes);
app.use('/api', profileRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/distance', distanceRoutes);
app.use('/api/chat', chatRoutes);

// Initialize HTTP server and WebSocket server
const server = http.createServer(app);
initializeSocket(server);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
