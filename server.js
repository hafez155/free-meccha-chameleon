'use strict';

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
});

const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
//  WORD POOL  (5 topics, each 4×4 = 16 words)
// ─────────────────────────────────────────────
const TOPICS = [
  {
    name: 'Animals',
    words: [
      ['Lion',    'Tiger',   'Elephant', 'Giraffe'],
      ['Penguin', 'Dolphin', 'Eagle',    'Shark'],
      ['Cheetah', 'Gorilla', 'Flamingo', 'Crocodile'],
      ['Kangaroo','Panda',   'Cobra',    'Parrot'],
    ],
  },
  {
    name: 'Food & Drink',
    words: [
      ['Pizza',   'Sushi',   'Tacos',    'Burger'],
      ['Ramen',   'Steak',   'Lobster',  'Spaghetti'],
      ['Tiramisu','Croissant','Mango',   'Avocado'],
      ['Whiskey', 'Espresso','Champagne','Lemonade'],
    ],
  },
  {
    name: 'Countries',
    words: [
      ['Japan',   'Brazil',  'Germany',  'Egypt'],
      ['Canada',  'India',   'Argentina','Nigeria'],
      ['France',  'Mexico',  'Australia','Thailand'],
      ['Iceland', 'Morocco', 'Colombia', 'Sweden'],
    ],
  },
  {
    name: 'Movies',
    words: [
      ['Inception','Avatar',   'Titanic',  'Gladiator'],
      ['Parasite', 'Interstellar','Joker', 'Frozen'],
      ['Matrix',   'Alien',    'Casablanca','Grease'],
      ['Dunkirk',  'Coco',     'Jaws',     'Rocky'],
    ],
  },
  {
    name: 'Sports',
    words: [
      ['Football', 'Basketball','Tennis',  'Swimming'],
      ['Baseball', 'Volleyball','Golf',    'Boxing'],
      ['Wrestling','Cycling',   'Skiing',  'Archery'],
      ['Surfing',  'Fencing',   'Rowing',  'Judo'],
    ],
  },
  {
    name: 'Superheroes',
    words: [
      ['Superman', 'Batman',   'Spider-Man','Wonder Woman'],
      ['Iron Man', 'Thor',     'Hulk',      'Captain America'],
      ['Flash',    'Aquaman',  'Black Panther','Wolverine'],
      ['Deadpool', 'Ant-Man',  'Doctor Strange','Hawkeye'],
    ],
  },
  {
    name: 'Musical Instruments',
    words: [
      ['Guitar',   'Piano',    'Violin',   'Drums'],
      ['Trumpet',  'Flute',    'Cello',    'Saxophone'],
      ['Harp',     'Clarinet', 'Trombone', 'Ukulele'],
      ['Banjo',    'Accordion', 'Oboe',    'Marimba'],
    ],
  },
];

// ─────────────────────────────────────────────
//  IN-MEMORY STATE
// ─────────────────────────────────────────────
const rooms = new Map();

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function colLetter(col) {
  return String.fromCharCode(65 + col);
}

function roomPublicState(room) {
  const players = [];
  for (const [id, p] of room.players) {
    players.push({
      id,
      username: p.username,
      ready: p.ready,
      connected: p.connected,
      score: room.scores.get(id) ?? 0,
    });
  }
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players,
    roundNumber: room.roundNumber,
    topic: room.topic ? room.topic.name : null,
    grid: room.topic ? room.topic.words : null,
    turnOrder: room.turnOrder,
    currentTurnIndex: room.currentTurnIndex,
    clues: room.clues ? Object.fromEntries(room.clues) : {},
    votes: room.votes ? Object.fromEntries(room.votes) : {},
  };
}

function privatePlayerInfo(room, socketId) {
  const isChameleon = room.chameleonId === socketId;
  return {
    role: isChameleon ? 'chameleon' : 'innocent',
    secretCoord: isChameleon ? null : room.secretCoord,
    secretWord: isChameleon ? null : room.secretWord,
    chameleonId: null,
  };
}

function broadcastRoomState(room) {
  io.to(room.code).emit('room_state', roomPublicState(room));
}

function getConnectedPlayers(room) {
  return [...room.players.values()].filter((p) => p.connected);
}

function cleanupRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  if (room.guessTimer) clearTimeout(room.guessTimer);
  for (const p of room.players.values()) {
    if (p.disconnectTimeout) clearTimeout(p.disconnectTimeout);
  }
  rooms.delete(roomCode);
  console.log(`[Room ${roomCode}] Cleaned up.`);
}

// ─────────────────────────────────────────────
//  GAME LOGIC
// ─────────────────────────────────────────────
function startRound(room) {
  const topic = pickRandom(TOPICS);
  const row = Math.floor(Math.random() * 4);
  const col = Math.floor(Math.random() * 4);
  const secretWord = topic.words[row][col];

  const connected = getConnectedPlayers(room);
  const chameleon = pickRandom(connected);

  const turnOrder = shuffle(connected.map((p) => p.id));

  room.topic = topic;
  room.secretCoord = { row, col, label: `${colLetter(col)}${row + 1}` };
  room.secretWord = secretWord;
  room.chameleonId = chameleon.id;
  room.clues = new Map();
  room.votes = new Map();
  room.turnOrder = turnOrder;
  room.currentTurnIndex = 0;
  room.phase = 'describing';
  room.roundNumber = (room.roundNumber || 0) + 1;
  if (room.guessTimer) { clearTimeout(room.guessTimer); room.guessTimer = null; }

  console.log(
    `[Room ${room.code}] Round ${room.roundNumber} started. Topic: ${topic.name}, Secret: ${secretWord} (${room.secretCoord.label}), Chameleon: ${chameleon.username}`
  );

  broadcastRoomState(room);

  for (const [sid] of room.players) {
    const socket = io.sockets.sockets.get(sid);
    if (socket) {
      socket.emit('private_info', privatePlayerInfo(room, sid));
    }
  }

  announceTurn(room);
}

function announceTurn(room) {
  if (room.phase !== 'describing') return;
  const currentId = room.turnOrder[room.currentTurnIndex];
  io.to(room.code).emit('your_turn', { currentPlayerId: currentId });
}

function advanceTurn(room) {
  room.currentTurnIndex++;
  if (room.currentTurnIndex >= room.turnOrder.length) {
    startVoting(room);
  } else {
    broadcastRoomState(room);
    announceTurn(room);
  }
}

function startVoting(room) {
  room.phase = 'voting';
  room.votes = new Map();
  broadcastRoomState(room);
  io.to(room.code).emit('phase_change', { phase: 'voting' });
}

function checkVotingComplete(room) {
  const connected = getConnectedPlayers(room);
  const voted = [...room.votes.keys()].filter((id) => room.players.has(id));
  if (voted.length >= connected.length) {
    resolveVoting(room);
  }
}

function resolveVoting(room) {
  const tally = {};
  for (const [, suspect] of room.votes) {
    tally[suspect] = (tally[suspect] || 0) + 1;
  }

  let maxVotes = 0;
  let votedOutId = null;
  for (const [pid, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count;
      votedOutId = pid;
    } else if (count === maxVotes) {
      votedOutId = null;
    }
  }

  const chameleonCaught = votedOutId === room.chameleonId;

  console.log(
    `[Room ${room.code}] Voting resolved. VotedOut: ${votedOutId}, Chameleon: ${room.chameleonId}, Caught: ${chameleonCaught}`
  );

  if (!chameleonCaught) {
    room.phase = 'reveal';
    const chameleon = room.players.get(room.chameleonId);
    addScore(room, room.chameleonId, 3);
    broadcastRoomState(room);
    io.to(room.code).emit('reveal', {
      chameleonId: room.chameleonId,
      chameleonName: chameleon?.username ?? '?',
      secretWord: room.secretWord,
      secretCoord: room.secretCoord,
      result: 'chameleon_wins_vote',
      votedOutId,
      tally,
      scores: Object.fromEntries(room.scores),
    });
  } else {
    room.phase = 'chameleon_guess';
    broadcastRoomState(room);

    const chameleon = room.players.get(room.chameleonId);
    io.to(room.code).emit('chameleon_caught', {
      chameleonId: room.chameleonId,
      chameleonName: chameleon?.username ?? '?',
      votedOutId,
      tally,
    });

    let secondsLeft = 15;
    const interval = setInterval(() => {
      secondsLeft--;
      io.to(room.code).emit('guess_timer', { secondsLeft });
      if (secondsLeft <= 0) {
        clearInterval(interval);
        room.guessTimer = null;
        resolveGuess(room, null);
      }
    }, 1000);

    room.guessTimer = interval;

    const chameleonSocket = io.sockets.sockets.get(room.chameleonId);
    if (chameleonSocket) {
      chameleonSocket.emit('request_guess', {
        grid: room.topic.words,
        secondsLeft: 15,
      });
    }
  }
}

function resolveGuess(room, guess) {
  if (room.guessTimer) { clearInterval(room.guessTimer); room.guessTimer = null; }
  if (room.phase !== 'chameleon_guess') return;
  room.phase = 'reveal';

  const correct =
    guess !== null &&
    guess.trim().toLowerCase() === room.secretWord.toLowerCase();

  const chameleonWins = correct;
  const chameleonPlayer = room.players.get(room.chameleonId);

  if (chameleonWins) {
    addScore(room, room.chameleonId, 2);
  } else {
    for (const [id] of room.players) {
      if (id !== room.chameleonId) addScore(room, id, 1);
    }
  }

  broadcastRoomState(room);
  io.to(room.code).emit('reveal', {
    chameleonId: room.chameleonId,
    chameleonName: chameleonPlayer?.username ?? '?',
    secretWord: room.secretWord,
    secretCoord: room.secretCoord,
    result: chameleonWins ? 'chameleon_wins_guess' : 'innocents_win',
    guess,
    correct,
    scores: Object.fromEntries(room.scores),
  });

  console.log(
    `[Room ${room.code}] Round resolved. Guess: "${guess}", Correct: ${correct}, Result: ${chameleonWins ? 'chameleon_wins' : 'innocents_win'}`
  );
}

function addScore(room, playerId, points) {
  room.scores.set(playerId, (room.scores.get(playerId) ?? 0) + points);
}

function resetToLobby(room) {
  if (room.guessTimer) { clearInterval(room.guessTimer); room.guessTimer = null; }
  room.phase = 'lobby';
  room.topic = null;
  room.secretCoord = null;
  room.secretWord = null;
  room.chameleonId = null;
  room.clues = new Map();
  room.votes = new Map();
  room.turnOrder = [];
  room.currentTurnIndex = 0;
  for (const p of room.players.values()) p.ready = false;
  broadcastRoomState(room);
  io.to(room.code).emit('phase_change', { phase: 'lobby' });
}

// ─────────────────────────────────────────────
//  SOCKET EVENT HANDLERS
// ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('create_room', ({ username }, callback) => {
    if (!username || username.trim().length < 1) {
      return callback({ error: 'Username is required.' });
    }
    const name = username.trim().slice(0, 20);
    const code = generateRoomCode();

    const room = {
      code,
      hostId: socket.id,
      players: new Map(),
      phase: 'lobby',
      topic: null,
      secretCoord: null,
      secretWord: null,
      chameleonId: null,
      clues: new Map(),
      votes: new Map(),
      turnOrder: [],
      currentTurnIndex: 0,
      guessTimer: null,
      roundNumber: 0,
      scores: new Map(),
    };

    room.players.set(socket.id, {
      id: socket.id,
      username: name,
      ready: false,
      connected: true,
      disconnectTimeout: null,
    });
    room.scores.set(socket.id, 0);

    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.username = name;

    console.log(`[Room ${code}] Created by ${name} (${socket.id})`);
    callback({ success: true, roomCode: code, playerId: socket.id });
    broadcastRoomState(room);
  });

  socket.on('join_room', ({ username, roomCode }, callback) => {
    if (!username || username.trim().length < 1) {
      return callback({ error: 'Username is required.' });
    }
    const code = roomCode?.trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return callback({ error: 'Room not found.' });
    if (room.phase !== 'lobby') return callback({ error: 'Game already in progress.' });
    if (room.players.size >= 8) return callback({ error: 'Room is full (max 8 players).' });

    const name = username.trim().slice(0, 20);
    for (const p of room.players.values()) {
      if (p.username.toLowerCase() === name.toLowerCase() && p.connected) {
        return callback({ error: 'Username already taken in this room.' });
      }
    }

    room.players.set(socket.id, {
      id: socket.id,
      username: name,
      ready: false,
      connected: true,
      disconnectTimeout: null,
    });
    room.scores.set(socket.id, 0);

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.username = name;

    console.log(`[Room ${code}] ${name} (${socket.id}) joined.`);
    callback({ success: true, roomCode: code, playerId: socket.id });
    broadcastRoomState(room);
    io.to(code).emit('player_joined', { username: name });
  });

  socket.on('toggle_ready', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.get(socket.id);
    if (!player) return;
    player.ready = !player.ready;
    broadcastRoomState(room);
  });

  socket.on('start_game', (callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb({ error: 'Room not found.' });
    if (room.hostId !== socket.id) return cb({ error: 'Only the host can start the game.' });
    const connected = getConnectedPlayers(room);
    if (connected.length < 3) return cb({ error: 'Need at least 3 players to start.' });
    const notReady = connected.filter((p) => !p.ready && p.id !== room.hostId);
    if (notReady.length > 0) return cb({ error: 'All players must be ready.' });

    startRound(room);
    cb({ success: true });
  });

  socket.on('submit_clue', ({ clue }, callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'describing') return cb({ error: 'Not in description phase.' });
    if (room.turnOrder[room.currentTurnIndex] !== socket.id) {
      return cb({ error: "It's not your turn." });
    }
    if (!clue || clue.trim().length === 0) return cb({ error: 'Clue cannot be empty.' });
    const word = clue.trim().split(/\s+/)[0].slice(0, 30);

    room.clues.set(socket.id, word);
    broadcastRoomState(room);
    cb({ success: true, word });
    advanceTurn(room);
  });

  socket.on('submit_vote', ({ suspectId }, callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'voting') return cb({ error: 'Not in voting phase.' });
    if (!room.players.has(suspectId)) return cb({ error: 'Invalid suspect.' });
    if (socket.id === suspectId) return cb({ error: 'You cannot vote for yourself.' });
    if (room.votes.has(socket.id)) return cb({ error: 'You have already voted.' });

    room.votes.set(socket.id, suspectId);
    broadcastRoomState(room);
    cb({ success: true });
    io.to(room.code).emit('vote_cast', {
      voterId: socket.id,
      voterName: room.players.get(socket.id)?.username,
    });
    checkVotingComplete(room);
  });

  socket.on('chameleon_guess', ({ guess }, callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'chameleon_guess') return cb({ error: 'Not in guess phase.' });
    if (room.chameleonId !== socket.id) return cb({ error: 'You are not the Chameleon.' });
    if (!guess || guess.trim().length === 0) return cb({ error: 'Guess cannot be empty.' });

    cb({ success: true });
    resolveGuess(room, guess.trim());
  });

  socket.on('play_again', (callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb({ error: 'Room not found.' });
    if (room.hostId !== socket.id) return cb({ error: 'Only the host can start a new round.' });
    if (!['reveal', 'chameleon_guess'].includes(room.phase)) {
      return cb({ error: 'Game not finished yet.' });
    }

    resetToLobby(room);
    cb({ success: true });
  });

  socket.on('kick_player', ({ playerId }, callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb({ error: 'Room not found.' });
    if (room.hostId !== socket.id) return cb({ error: 'Only the host can kick players.' });
    if (!room.players.has(playerId)) return cb({ error: 'Player not found.' });
    if (playerId === socket.id) return cb({ error: 'Cannot kick yourself.' });

    const kicked = room.players.get(playerId);
    room.players.delete(playerId);
    room.scores.delete(playerId);

    const kickedSocket = io.sockets.sockets.get(playerId);
    if (kickedSocket) {
      kickedSocket.emit('kicked', { message: 'You were kicked from the room.' });
      kickedSocket.leave(room.code);
    }

    io.to(room.code).emit('player_left', { username: kicked?.username, kicked: true });
    broadcastRoomState(room);
    cb({ success: true });
  });

  socket.on('send_chat', ({ message }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    const text = (message || '').trim().slice(0, 200);
    if (!text) return;
    io.to(room.code).emit('chat_message', {
      senderId: socket.id,
      senderName: player.username,
      message: text,
      timestamp: Date.now(),
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;
    player.connected = false;

    io.to(roomCode).emit('player_disconnected', { username: player.username });
    broadcastRoomState(room);

    player.disconnectTimeout = setTimeout(() => {
      if (room.players.has(socket.id)) {
        const connectedNow = room.players.get(socket.id);
        if (connectedNow && !connectedNow.connected) {
          room.players.delete(socket.id);
          room.scores.delete(socket.id);
          io.to(roomCode).emit('player_left', { username: player.username });

          if (room.hostId === socket.id) {
            const remaining = [...room.players.keys()];
            if (remaining.length > 0) {
              room.hostId = remaining[0];
              io.to(roomCode).emit('host_changed', {
                newHostId: room.hostId,
                newHostName: room.players.get(room.hostId)?.username,
              });
            }
          }

          if (room.players.size === 0) {
            cleanupRoom(roomCode);
            return;
          }

          const connected = getConnectedPlayers(room);
          if (room.phase !== 'lobby' && connected.length < 2) {
            io.to(roomCode).emit('game_aborted', {
              message: 'Not enough players to continue. Returning to lobby.',
            });
            resetToLobby(room);
          } else if (room.phase === 'describing') {
            if (room.turnOrder[room.currentTurnIndex] === socket.id) {
              room.turnOrder = room.turnOrder.filter((id) => id !== socket.id);
              room.currentTurnIndex = Math.min(
                room.currentTurnIndex,
                room.turnOrder.length - 1
              );
              if (room.turnOrder.length === 0) {
                startVoting(room);
              } else {
                broadcastRoomState(room);
                announceTurn(room);
              }
            } else {
              room.turnOrder = room.turnOrder.filter((id) => id !== socket.id);
              broadcastRoomState(room);
            }
          } else if (room.phase === 'voting') {
            room.turnOrder = room.turnOrder.filter((id) => id !== socket.id);
            checkVotingComplete(room);
          } else if (room.phase === 'chameleon_guess' && room.chameleonId === socket.id) {
            resolveGuess(room, null);
          }

          broadcastRoomState(room);
        }
      }
    }, 30_000);
  });

  socket.on('reconnect_player', ({ roomCode, username }, callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};
    const code = (roomCode || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return cb({ error: 'Room not found.' });

    let foundId = null;
    for (const [id, p] of room.players) {
      if (
        p.username.toLowerCase() === (username || '').trim().toLowerCase() &&
        !p.connected
      ) {
        foundId = id;
        break;
      }
    }

    if (!foundId) {
      return cb({ error: 'No disconnected player found with that name.' });
    }

    const oldPlayer = room.players.get(foundId);
    if (oldPlayer.disconnectTimeout) {
      clearTimeout(oldPlayer.disconnectTimeout);
      oldPlayer.disconnectTimeout = null;
    }

    room.players.delete(foundId);
    const score = room.scores.get(foundId) ?? 0;
    room.scores.delete(foundId);

    oldPlayer.id = socket.id;
    oldPlayer.connected = true;
    room.players.set(socket.id, oldPlayer);
    room.scores.set(socket.id, score);

    if (room.hostId === foundId) room.hostId = socket.id;
    if (room.chameleonId === foundId) room.chameleonId = socket.id;
    room.turnOrder = room.turnOrder.map((id) => (id === foundId ? socket.id : id));
    if (room.clues.has(foundId)) {
      const clue = room.clues.get(foundId);
      room.clues.delete(foundId);
      room.clues.set(socket.id, clue);
    }
    if (room.votes.has(foundId)) {
      const vote = room.votes.get(foundId);
      room.votes.delete(foundId);
      room.votes.set(socket.id, vote);
    }
    for (const [voter, suspect] of room.votes) {
      if (suspect === foundId) room.votes.set(voter, socket.id);
    }

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.username = oldPlayer.username;

    cb({ success: true, roomCode: code, playerId: socket.id });
    broadcastRoomState(room);
    if (room.phase !== 'lobby' && room.phase !== 'reveal') {
      socket.emit('private_info', privatePlayerInfo(room, socket.id));
    }
    io.to(code).emit('player_reconnected', { username: oldPlayer.username });
  });
});

// ─────────────────────────────────────────────
//  STATIC FILES & SERVER START
// ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`\n🦎  Chameleon Game Server running on http://localhost:${PORT}\n`);
});
