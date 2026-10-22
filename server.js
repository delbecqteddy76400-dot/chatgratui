const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const cleanText = (value, maxLength = 300) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
};

const cleanUser = (value, maxLength = 24) => {
  const text = cleanText(value, maxLength);
  return text || 'Anonyme';
};

const getTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const messages = [
  {
    user: 'System',
    text: 'Bienvenue sur le chat en temps réel !',
    time: getTime(),
  },
];

io.on('connection', (socket) => {
  socket.emit('chat:history', messages);
  io.emit('chat:users', io.engine.clientsCount);

  socket.on('chat:message', (payload) => {
    const user = cleanUser(payload?.user);
    const text = cleanText(payload?.text, 300);

    if (!text) return;

    const message = {
      user,
      text,
      time: getTime(),
    };

    messages.push(message);

    if (messages.length > 100) {
      messages.shift();
    }

    io.emit('chat:message', message);
  });

  socket.on('chat:typing', (payload) => {
    const user = cleanUser(payload?.user, 24);
    socket.broadcast.emit('chat:typing', user);
  });

  socket.on('disconnect', () => {
    io.emit('chat:users', io.engine.clientsCount);
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

server.listen(PORT, () => {
  console.log(`Chat en ligne sur http://localhost:${PORT}`);
});
