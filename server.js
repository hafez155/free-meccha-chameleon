'use strict';

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' }, pingTimeout: 60000 });
const PORT   = process.env.PORT || 3000;

// ─────────────────────────────────────────────
//  MAPS
// ─────────────────────────────────────────────
const MAPS = [
  {
    id: 'arcade', name: 'Arcade', emoji: '🕹️',
    fogColor: '#0a0018', floorColor: '#08000f', wallColor: '#0d0018',
    panels: [
      { x:-15.9, y:1.8, z: 0,  rotY: Math.PI/2,  w:3.5, h:3.5, color:'#ff0080' },
      { x:-15.9, y:1.8, z: 9,  rotY: Math.PI/2,  w:3.5, h:3.5, color:'#00ffff' },
      { x:-15.9, y:1.8, z:-9,  rotY: Math.PI/2,  w:3.5, h:3.5, color:'#ffff00' },
      { x: 15.9, y:1.8, z: 0,  rotY:-Math.PI/2,  w:3.5, h:3.5, color:'#00ff80' },
      { x: 15.9, y:1.8, z: 9,  rotY:-Math.PI/2,  w:3.5, h:3.5, color:'#ff8000' },
      { x: 15.9, y:1.8, z:-9,  rotY:-Math.PI/2,  w:3.5, h:3.5, color:'#a020f0' },
      { x: 0,    y:1.8, z:-15.9, rotY:0,          w:3.5, h:3.5, color:'#ff4040' },
      { x: 9,    y:1.8, z:-15.9, rotY:0,          w:3.5, h:3.5, color:'#40ff40' },
      { x:-9,    y:1.8, z:-15.9, rotY:0,          w:3.5, h:3.5, color:'#4040ff' },
      { x: 0,    y:1.8, z: 15.9, rotY:Math.PI,    w:3.5, h:3.5, color:'#ff40ff' },
      { x: 9,    y:1.8, z: 15.9, rotY:Math.PI,    w:3.5, h:3.5, color:'#40ffff' },
      { x:-9,    y:1.8, z: 15.9, rotY:Math.PI,    w:3.5, h:3.5, color:'#ffff40' },
    ],
    obstacles: [
      { x:6, z:6, w:2, h:2.5, d:2 }, { x:-6, z:6, w:2, h:2.5, d:2 },
      { x:6, z:-6, w:2, h:2.5, d:2 }, { x:-6, z:-6, w:2, h:2.5, d:2 },
      { x:0, z:0, w:3, h:1, d:3 },
    ],
  },
  {
    id: 'forest', name: 'Forest', emoji: '🌲',
    fogColor: '#051005', floorColor: '#081208', wallColor: '#0a180a',
    panels: [
      { x:-15.9, y:1.8, z: 0,  rotY: Math.PI/2,  w:3.5, h:3.5, color:'#2d7a1b' },
      { x:-15.9, y:1.8, z: 9,  rotY: Math.PI/2,  w:3.5, h:3.5, color:'#7a4a1b' },
      { x:-15.9, y:1.8, z:-9,  rotY: Math.PI/2,  w:3.5, h:3.5, color:'#1b5c1b' },
      { x: 15.9, y:1.8, z: 0,  rotY:-Math.PI/2,  w:3.5, h:3.5, color:'#b0901a' },
      { x: 15.9, y:1.8, z: 9,  rotY:-Math.PI/2,  w:3.5, h:3.5, color:'#4a8a4a' },
      { x: 15.9, y:1.8, z:-9,  rotY:-Math.PI/2,  w:3.5, h:3.5, color:'#8a6030' },
      { x: 0,    y:1.8, z:-15.9, rotY:0,          w:3.5, h:3.5, color:'#3a7a3a' },
      { x: 9,    y:1.8, z:-15.9, rotY:0,          w:3.5, h:3.5, color:'#6a5020' },
      { x:-9,    y:1.8, z:-15.9, rotY:0,          w:3.5, h:3.5, color:'#2a6a2a' },
      { x: 0,    y:1.8, z: 15.9, rotY:Math.PI,    w:3.5, h:3.5, color:'#5a9a3a' },
      { x: 9,    y:1.8, z: 15.9, rotY:Math.PI,    w:3.5, h:3.5, color:'#9a6a30' },
      { x:-9,    y:1.8, z: 15.9, rotY:Math.PI,    w:3.5, h:3.5, color:'#3a6a3a' },
    ],
    obstacles: [
      { x:7, z:4, w:1.5, h:5, d:1.5 }, { x:-7, z:4, w:1.5, h:5, d:1.5 },
      { x:4, z:-7, w:1.5, h:5, d:1.5 }, { x:-4, z:-7, w:1.5, h:5, d:1.5 },
      { x:0, z:0, w:2, h:4, d:2 }, { x:9, z:-3, w:1.5, h:3, d:1.5 },
    ],
  },
  {
    id: 'space', name: 'Space Station', emoji: '🚀',
    fogColor: '#000008', floorColor: '#05050f', wallColor: '#080818',
    panels: [
      { x:-15.9, y:1.8, z: 0,  rotY: Math.PI/2,  w:3.5, h:3.5, color:'#1a1a8a' },
      { x:-15.9, y:1.8, z: 9,  rotY: Math.PI/2,  w:3.5, h:3.5, color:'#8a1a8a' },
      { x:-15.9, y:1.8, z:-9,  rotY: Math.PI/2,  w:3.5, h:3.5, color:'#1a8a8a' },
      { x: 15.9, y:1.8, z: 0,  rotY:-Math.PI/2,  w:3.5, h:3.5, color:'#5a5aaa' },
      { x: 15.9, y:1.8, z: 9,  rotY:-Math.PI/2,  w:3.5, h:3.5, color:'#aa1a5a' },
      { x: 15.9, y:1.8, z:-9,  rotY:-Math.PI/2,  w:3.5, h:3.5, color:'#1aaa5a' },
      { x: 0,    y:1.8, z:-15.9, rotY:0,          w:3.5, h:3.5, color:'#6a2aaa' },
      { x: 9,    y:1.8, z:-15.9, rotY:0,          w:3.5, h:3.5, color:'#aa6a1a' },
      { x:-9,    y:1.8, z:-15.9, rotY:0,          w:3.5, h:3.5, color:'#2aaaaa' },
      { x: 0,    y:1.8, z: 15.9, rotY:Math.PI,    w:3.5, h:3.5, color:'#aa2aaa' },
      { x: 9,    y:1.8, z: 15.9, rotY:Math.PI,    w:3.5, h:3.5, color:'#2a6aaa' },
      { x:-9,    y:1.8, z: 15.9, rotY:Math.PI,    w:3.5, h:3.5, color:'#aaaa2a' },
    ],
    obstacles: [
      { x:5, z:5, w:2, h:3, d:2 }, { x:-5, z:5, w:2, h:3, d:2 },
      { x:5, z:-5, w:2, h:3, d:2 }, { x:-5, z:-5, w:2, h:3, d:2 },
      { x:0, z:0, w:4, h:1.5, d:4 }, { x:0, z:9, w:2, h:2, d:2 }, { x:0, z:-9, w:2, h:2, d:2 },
    ],
  },
];

const GAME_DURATION = 90;
const rooms = new Map();

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do { code = Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join(''); }
  while (rooms.has(code));
  return code;
}
function pickRandom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function getRoom(socket) { return rooms.get(socket.data.roomCode); }

function broadcastLobby(room) {
  io.to(room.code).emit('lobby_state', {
    code: room.code, hostId: room.hostId, mapId: room.mapId,
    players: [...room.players.values()].map(p => ({
      id:p.id, username:p.username, ready:p.ready, score:p.score,
    })),
  });
}

function broadcastGame(room) {
  io.to(room.code).emit('game_tick', {
    players: [...room.players.values()].map(p => ({
      id:p.id, x:p.x, y:p.y, z:p.z, rotY:p.rotY,
      color:p.color, blendLevel:p.blendLevel,
      isChameleon:p.isChameleon, caught:p.caught,
      username:p.username,
    })),
    timer: room.timer,
  });
}

function startGame(room) {
  const players = [...room.players.values()];
  const cham = pickRandom(players);
  const map  = MAPS.find(m=>m.id===room.mapId) || MAPS[0];

  const spawns = [
    {x:0,z:0},{x:5,z:5},{x:-5,z:5},{x:5,z:-5},{x:-5,z:-5},
    {x:0,z:8},{x:8,z:0},{x:-8,z:0},
  ];

  players.forEach((p, i) => {
    const sp = spawns[i % spawns.length];
    Object.assign(p, {
      isChameleon: p.id === cham.id,
      caught: false, blendLevel: 0,
      color: p.id === cham.id ? '#22c55e' : '#60a5fa',
      x: sp.x, y: 0.9, z: sp.z, rotY: 0,
    });
    const sock = io.sockets.sockets.get(p.id);
    if (sock) sock.emit('role_info', { isChameleon: p.isChameleon, map });
  });

  room.phase      = 'playing';
  room.timer      = GAME_DURATION;
  room.chameleonId = cham.id;

  io.to(room.code).emit('game_start', { map, mapId: room.mapId });
  broadcastGame(room);

  room.timerInterval = setInterval(() => {
    room.timer = Math.max(0, room.timer - 1);
    if (room.timer <= 0) { clearInterval(room.timerInterval); room.timerInterval = null; endGame(room,'timeout',null); }
  }, 1000);
}

function endGame(room, reason, catcherId) {
  if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
  room.phase = 'ended';
  const cham = room.players.get(room.chameleonId);
  const chameleonWins = reason === 'timeout';

  if (chameleonWins) {
    if (cham) cham.score += 3;
  } else {
    for (const p of room.players.values()) if (!p.isChameleon) p.score += 1;
    if (catcherId && room.players.has(catcherId)) room.players.get(catcherId).score += 2;
  }

  io.to(room.code).emit('game_end', {
    reason, chameleonWins,
    chameleonId: room.chameleonId,
    chameleonName: cham?.username || '?',
    catcherName: catcherId ? room.players.get(catcherId)?.username : null,
    players: [...room.players.values()].map(p=>({id:p.id,username:p.username,score:p.score,isChameleon:p.isChameleon})),
  });
}

// ─────────────────────────────────────────────
//  SOCKET HANDLERS
// ─────────────────────────────────────────────
io.on('connection', socket => {
  socket.on('create_room', ({username, mapId}, cb) => {
    const name = (username||'').trim().slice(0,20);
    if (!name) return cb({error:'Name required.'});
    const code = generateCode();
    const room = { code, hostId:socket.id, phase:'lobby', mapId:mapId||'arcade',
                   players:new Map(), timer:GAME_DURATION, timerInterval:null, chameleonId:null };
    room.players.set(socket.id,{id:socket.id,username:name,ready:false,score:0,
      x:0,y:0.9,z:0,rotY:0,color:'#60a5fa',blendLevel:0,isChameleon:false,caught:false});
    rooms.set(code,room);
    socket.join(code);
    socket.data.roomCode = code; socket.data.username = name;
    cb({success:true,roomCode:code,playerId:socket.id});
    broadcastLobby(room);
  });

  socket.on('join_room', ({username,roomCode}, cb) => {
    const name = (username||'').trim().slice(0,20);
    const code = (roomCode||'').trim().toUpperCase();
    if (!name) return cb({error:'Name required.'});
    const room = rooms.get(code);
    if (!room) return cb({error:'Room not found.'});
    if (room.phase !== 'lobby') return cb({error:'Game in progress.'});
    if (room.players.size >= 8) return cb({error:'Room full.'});
    room.players.set(socket.id,{id:socket.id,username:name,ready:false,score:0,
      x:0,y:0.9,z:0,rotY:0,color:'#60a5fa',blendLevel:0,isChameleon:false,caught:false});
    socket.join(code);
    socket.data.roomCode = code; socket.data.username = name;
    cb({success:true,roomCode:code,playerId:socket.id});
    broadcastLobby(room);
    io.to(code).emit('chat_msg',{sys:true,msg:`${name} joined!`});
  });

  socket.on('toggle_ready', () => {
    const room = getRoom(socket); if (!room||room.phase!=='lobby') return;
    const p = room.players.get(socket.id); if (!p) return;
    p.ready = !p.ready; broadcastLobby(room);
  });

  socket.on('set_map', ({mapId}) => {
    const room = getRoom(socket); if (!room||room.hostId!==socket.id) return;
    if (MAPS.find(m=>m.id===mapId)) { room.mapId = mapId; broadcastLobby(room); }
  });

  socket.on('start_game', cb => {
    const c = typeof cb==='function'?cb:()=>{};
    const room = getRoom(socket);
    if (!room) return c({error:'Room not found.'});
    if (room.hostId!==socket.id) return c({error:'Only host can start.'});
    if (room.players.size < 2) return c({error:'Need at least 2 players.'});
    startGame(room); c({success:true});
  });

  socket.on('player_move', data => {
    const room = getRoom(socket); if (!room||room.phase!=='playing') return;
    const p = room.players.get(socket.id); if (!p||p.caught) return;
    p.x=data.x; p.y=data.y; p.z=data.z; p.rotY=data.rotY;
  });

  socket.on('chameleon_blend', ({blendLevel,color}) => {
    const room = getRoom(socket); if (!room||room.phase!=='playing') return;
    const p = room.players.get(socket.id); if (!p||!p.isChameleon) return;
    p.blendLevel = Math.max(0,Math.min(1,blendLevel));
    if (color) p.color = color;
  });

  socket.on('hunter_click', ({targetId}) => {
    const room = getRoom(socket); if (!room||room.phase!=='playing') return;
    const hunter = room.players.get(socket.id);
    const target = room.players.get(targetId);
    if (!hunter||!target||hunter.isChameleon||target.caught) return;
    if (!target.isChameleon) {
      socket.emit('wrong_guess',{name:target.username});
      return;
    }
    target.caught = true;
    io.to(room.code).emit('player_caught',{
      caughtId:targetId, caughtName:target.username,
      catcherId:socket.id, catcherName:hunter.username,
    });
    setTimeout(()=>endGame(room,'caught',socket.id),2500);
  });

  socket.on('send_chat', ({message}) => {
    const room = getRoom(socket); if (!room) return;
    const p = room.players.get(socket.id); if (!p) return;
    const text = (message||'').trim().slice(0,150); if (!text) return;
    io.to(room.code).emit('chat_msg',{senderId:socket.id,senderName:p.username,msg:text});
  });

  socket.on('play_again', cb => {
    const c = typeof cb==='function'?cb:()=>{};
    const room = getRoom(socket);
    if (!room||room.hostId!==socket.id||room.phase!=='ended') return c({error:'Cannot restart.'});
    room.phase='lobby'; room.timer=GAME_DURATION; room.chameleonId=null;
    for (const p of room.players.values()) {
      p.ready=false; p.isChameleon=false; p.caught=false; p.blendLevel=0; p.color='#60a5fa';
    }
    io.to(room.code).emit('return_lobby');
    broadcastLobby(room); c({success:true});
  });

  socket.on('disconnect', () => {
    const room = getRoom(socket); if (!room) return;
    const p = room.players.get(socket.id);
    room.players.delete(socket.id);
    if (p) io.to(room.code).emit('chat_msg',{sys:true,msg:`${p.username} left.`});
    if (room.players.size===0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      rooms.delete(room.code); return;
    }
    if (room.hostId===socket.id) {
      room.hostId = [...room.players.keys()][0];
      io.to(room.code).emit('host_changed',{newHostId:room.hostId});
    }
    broadcastLobby(room);
  });
});

// ─── 20fps GAME BROADCAST ──────────────────────
setInterval(()=>{
  for (const room of rooms.values())
    if (room.phase==='playing') broadcastGame(room);
},50);

// ─────────────────────────────────────────────
//  STATIC & START
// ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname,'public'),{
  setHeaders:(res,fp)=>{ if(fp.endsWith('.html')) res.setHeader('Content-Type','text/html;charset=utf-8'); }
}));
app.get('/',(req,res)=>{
  res.setHeader('Content-Type','text/html;charset=utf-8');
  res.sendFile(path.join(__dirname,'public','index.html'));
});

server.listen(PORT,()=>console.log(`\n&#x1F98E;  Meccha Chameleon 3D running on http://localhost:${PORT}\n`));
