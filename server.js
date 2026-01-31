const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://risghad:rishad123@cluster0.nf3nbnh.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Message Schema
const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Scheduled Task: Reset data every night at 12 AM
cron.schedule('0 0 * * *', async () => {
  try {
    await Message.deleteMany({});
    console.log('Midnight Cleanup: All messages have been deleted.');
    io.emit('messagesCleared'); // Optional: Notify clients to clear their UI
  } catch (err) {
    console.error('Midnight Cleanup Error:', err);
  }
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io
io.on('connection', async (socket) => {
  console.log('A user connected');

  // Load last 50 messages
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
    socket.emit('previousMessages', messages.reverse());
  } catch (err) {
    console.error('Error fetching messages:', err);
  }

  // Handle new message
  socket.on('chatMessage', async (data) => {
    const { user, text } = data;

    const newMessage = new Message({ user, text });
    await newMessage.save();

    io.emit('message', {
      user,
      text,
      timestamp: newMessage.timestamp
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
