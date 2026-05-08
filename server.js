const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/ping', (req, res) => res.send('ok'));

// ─── Questions ───────────────────────────────────────────────────────────────
const QUESTIONS = [
  { question: "What is the average length of a human pregnancy?", answers: ["9 months", "40 weeks", "280 days", "All of the above"], correct: 3 },
  { question: "Which sense is most developed at birth?", answers: ["Vision", "Hearing", "Smell", "Touch"], correct: 2 },
  { question: "How many bones does a newborn baby have?", answers: ["206", "270", "300", "150"], correct: 1 },
  { question: "How much does the average newborn weigh?", answers: ["5–6 lbs", "7–8 lbs", "9–10 lbs", "11–12 lbs"], correct: 1 },
  { question: "Babies are born without which of the following?", answers: ["Taste buds", "Kneecaps", "Fingerprints", "Eyelashes"], correct: 1 },
  { question: "What color is a newborn's first poop (meconium)?", answers: ["Yellow", "Brown", "Green", "Black/Dark green"], correct: 3 },
  { question: "What can a baby do that an adult cannot?", answers: ["See in complete darkness", "Lick their elbow", "Sneeze with their eyes open", "Breathe and swallow at the same time"], correct: 3 },
  { question: "What is Kara having?", answers: ["Girl", "She's waiting to find out at birth", "Twins", "Boy"], correct: 3 },
  { question: "Where did Kara go on her babymoon?", answers: ["Korea", "Hawaii", "New York", "Mexico"], correct: 3 },
  { question: "What's the loudest a baby cry can reach?", answers: ["Motorcycle level (~95 dB)", "Vacuum cleaner level (~70 dB)", "Rock concert level (~120 dB)", "Chainsaw level (~110 dB)"], correct: 3 },
];

// ─── State ───────────────────────────────────────────────────────────────────
const rooms = {};
const socketToRoom = {}; // O(1) lookup: socketId -> roomCode

function getRoom(socketId) {
  const code = socketToRoom[socketId];
  return code ? rooms[code] : null;
}

function createRoom(roomCode) {
  return {
    roomCode, host: null, players: {},
    state: 'lobby', currentQuestion: -1,
    questionTimer: null, questionStartTime: null,
    collectedBottles: new Set(),
  };
}

function sanitized(room) {
  return Object.values(room.players).map(p => ({
    id: p.id, name: p.name, color: p.color, avatar: p.avatar,
    score: p.score, x: p.x, y: p.y, zone: p.zone, correct: p.correct, alive: p.alive,
  }));
}

function broadcast(room) {
  io.to(room.roomCode).emit('roomUpdate', {
    players: sanitized(room), host: room.host, state: room.state,
  });
}

function startQuestion(room) {
  const q = QUESTIONS[room.currentQuestion];
  room.state = 'question';
  room.questionStartTime = Date.now();
  room.collectedBottles = new Set();
  Object.values(room.players).forEach(p => {
    p.zone = -1; p.correct = false;
    p.x = 400 + (Math.random() - 0.5) * 100;
    p.y = 420;
  });
  io.to(room.roomCode).emit('newQuestion', {
    index: room.currentQuestion, total: QUESTIONS.length,
    question: q.question, answers: q.answers, duration: 15000,
  });
  broadcast(room);
  room.questionTimer = setTimeout(() => resolveQuestion(room), 15000);
}

function resolveQuestion(room) {
  clearTimeout(room.questionTimer);
  room.state = 'reveal';
  const q = QUESTIONS[room.currentQuestion];
  Object.values(room.players).forEach(p => {
    if (p.zone === q.correct) {
      p.correct = true;
      const elapsed = Math.min(1, (Date.now() - room.questionStartTime) / 15000);
      p.score += Math.round((1 - elapsed) * 400) + 100;
    } else { p.correct = false; }
    p.alive = p.correct;
  });
  io.to(room.roomCode).emit('questionReveal', { correct: q.correct, scores: sanitized(room) });
  broadcast(room);
  setTimeout(() => {
    if (room.currentQuestion + 1 < QUESTIONS.length) {
      room.currentQuestion++;
      Object.values(room.players).forEach(p => { p.alive = true; });
      startQuestion(room);
    } else {
      room.state = 'gameover';
      io.to(room.roomCode).emit('gameOver', { scores: sanitized(room).sort((a,b) => b.score - a.score) });
      broadcast(room);
    }
  }, 5000);
}

// ─── Socket Events ───────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('connect', socket.id);

  socket.on('createRoom', ({ name, color, avatar }) => {
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    rooms[roomCode] = createRoom(roomCode);
    const room = rooms[roomCode];
    room.host = socket.id;
    room.players[socket.id] = { id: socket.id, name, color, avatar, score: 0, x: 400, y: 420, zone: -1, correct: false, alive: true };
    socketToRoom[socket.id] = roomCode;
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode });
    broadcast(room);
  });

  socket.on('joinRoom', ({ roomCode, name, color, avatar }) => {
    const code = roomCode.toUpperCase().trim();
    const room = rooms[code];
    if (!room) { socket.emit('error', 'Room not found'); return; }
    if (room.state !== 'lobby') { socket.emit('error', 'Game already started'); return; }
    room.players[socket.id] = { id: socket.id, name, color, avatar, score: 0, x: 400, y: 420, zone: -1, correct: false, alive: true };
    socketToRoom[socket.id] = code;
    socket.join(code);
    socket.emit('roomJoined', { roomCode: code });
    broadcast(room);
  });

  socket.on('startGame', () => {
    const room = getRoom(socket.id);
    if (!room || room.host !== socket.id || room.state !== 'lobby') return;
    room.currentQuestion = 0;
    startQuestion(room);
  });

  // Throttle: only accept moves every 80ms per socket
  const lastMove = {};
  socket.on('playerMove', ({ x, y, zone }) => {
    const now = Date.now();
    if (lastMove[socket.id] && now - lastMove[socket.id] < 80) return;
    lastMove[socket.id] = now;
    const room = getRoom(socket.id);
    if (!room || room.state !== 'question') return;
    const player = room.players[socket.id];
    if (!player) return;
    player.x = Math.max(0, Math.min(800, x || 0));
    player.y = Math.max(0, Math.min(560, y || 0));
    player.zone = zone;
    socket.to(room.roomCode).emit('playerMoved', { id: socket.id, x: player.x, y: player.y, zone: player.zone });
  });

  socket.on('collectBottle', ({ bottleId }) => {
    const room = getRoom(socket.id);
    if (!room || room.state !== 'question') return;
    const player = room.players[socket.id];
    if (!player) return;
    if (room.collectedBottles.has(bottleId)) return;
    room.collectedBottles.add(bottleId);
    player.score += 20;
    io.to(room.roomCode).emit('bottleCollected', { bottleId, collectorId: socket.id, score: player.score });
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    const room = getRoom(socket.id);
    delete socketToRoom[socket.id];
    if (!room) return;
    delete room.players[socket.id];
    if (room.host === socket.id) {
      const remaining = Object.keys(room.players);
      if (remaining.length > 0) {
        room.host = remaining[0];
        io.to(room.roomCode).emit('newHost', { host: room.host });
      } else {
        clearTimeout(room.questionTimer);
        delete rooms[room.roomCode];
        return;
      }
    }
    broadcast(room);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🍼 Baby Shower Trivia on port ${PORT}`));
