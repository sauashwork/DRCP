require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const disasterRoutes = require('./routes/disasterRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const extractGeocodeRoutes = require('./routes/extractGeocodeRoutes');
const updateRoutes = require('./routes/updateRoutes');
const authRoutes = require('./routes/authRoutes');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Only require these AFTER io is defined!
const resourceRoutes = require('./routes/resourceRoutes')(io);
const socialMediaRoutes = require('./routes/socialMediaRoutes')(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/disasters', disasterRoutes);
app.use('/geocode', geocodeRoutes);
app.use('/gemini', geminiRoutes);
app.use('/extract-geocode', extractGeocodeRoutes);
app.use('/resources', resourceRoutes);
app.use('/disasters', socialMediaRoutes);
app.use('/disasters', updateRoutes);
app.use('/auth', authRoutes);
const verificationRoutes = require('./routes/verificationRoutes');
app.use('/disasters', verificationRoutes);
const reportRoutes = require('./routes/reportRoutes');
app.use('/reports', reportRoutes);

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };