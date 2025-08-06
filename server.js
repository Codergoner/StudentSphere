const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const rooms = {}; // {roomId: [{ from, to, text }]}

io.on('connection', socket => {
  socket.on('joinRoom', ({ user1, user2 }) => {
    const roomId = [user1, user2].sort().join(':');
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    socket.emit('chatHistory', rooms[roomId]);
  });

  socket.on('chatMessage', msg => {
    const roomId = [msg.from, msg.to].sort().join(':');
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(msg);
    io.to(roomId).emit('chatMessage', msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
