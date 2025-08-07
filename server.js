const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));
app.use(express.json());

// ------------------ Chat Logic ------------------
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

// ------------------ Leaderboard Logic ------------------
const salesData = {
  Alice: 120,
  Bob: 95,
  Carol: 130,
  Dave: 80,
  Eve: 110,
  Frank: 75,
  Grace: 90,
  Heidi: 100,
  Ivan: 60,
  Judy: 85,
  Mallory: 70,
  Niaj: 65
};

let leaderboard = [];

function updateLeaderboard() {
  const sorted = Object.entries(salesData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([seller, sales]) => ({ seller, sales }));
  leaderboard = sorted;
}

function scheduleWeeklyUpdate() {
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + ((7 - now.getDay()) % 7));
  next.setHours(23, 59, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 7);
  }
  const msUntilNext = next - now;
  setTimeout(() => {
    updateLeaderboard();
    setInterval(updateLeaderboard, 7 * 24 * 60 * 60 * 1000);
  }, msUntilNext);
}

scheduleWeeklyUpdate();
updateLeaderboard();

app.post('/api/sale', (req, res) => {
  const { seller, amount } = req.body;
  if (!seller || typeof amount !== 'number') {
    return res.status(400).json({ error: 'seller and amount required' });
  }
  salesData[seller] = (salesData[seller] || 0) + amount;
  res.json({ success: true });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
