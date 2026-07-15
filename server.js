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
    id: 'arcade', name: 'Arcade Arena', emoji: '🕹️',
    fogColor: '#070b14', floorColor: '#0a0f1d', wallColor: '#080a14',
    panels: [
      { x:-17.9, y:2, z: 0,  rotY: Math.PI/2,  w:4, h:4, color:'#ff007f' },
      { x:-17.9, y:2, z: 10, rotY: Math.PI/2,  w:4, h:4, color:'#00f6ff' },
      { x:-17.9, y:2, z:-10, rotY: Math.PI/2,  w:4, h:4, color:'#ffea00' },
      { x: 17.9, y:2, z: 0,  rotY:-Math.PI/2,  w:4, h:4, color:'#00ff66' },
      { x: 17.9, y:2, z: 10, rotY:-Math.PI/2,  w:4, h:4, color:'#ff8c00' },
      { x: 17.9, y:2, z:-10, rotY:-Math.PI/2,  w:4, h:4, color:'#9900ff' },
      { x: 0,    y:2, z:-17.9, rotY:0,          w:4, h:4, color:'#ff3333' },
      { x: 10,   y:2, z:-17.9, rotY:0,          w:4, h:4, color:'#33ff33' },
      { x:-10,   y:2, z:-17.9, rotY:0,          w:4, h:4, color:'#3333ff' },
      { x: 0,    y:2, z: 17.9, rotY:Math.PI,    w:4, h:4, color:'#ff33ff' },
      { x: 10,   y:2, z: 17.9, rotY:Math.PI,    w:4, h:4, color:'#33ffff' },
      { x:-10,   y:2, z: 17.9, rotY:Math.PI,    w:4, h:4, color:'#ffff33' },
    ],
    obstacles: [
      { x:7, z:7, w:2.5, h:3, d:2.5 }, { x:-7, z:7, w:2.5, h:3, d:2.5 },
      { x:7, z:-7, w:2.5, h:3, d:2.5 }, { x:-7, z:-7, w:2.5, h:3, d:2.5 },
      { x:0, z:0, w:4, h:1.2, d:4 },
    ],
  },
  {
    id: 'forest', name: 'Forest Hideout', emoji: '🌲',
    fogColor: '#040d06', floorColor: '#07150a', wallColor: '#051108',
    panels: [
      { x:-17.9, y:2, z: 0,  rotY: Math.PI/2,  w:4, h:4, color:'#2a751c' },
      { x:-17.9, y:2, z: 10, rotY: Math.PI/2,  w:4, h:4, color:'#7c4915' },
      { x:-17.9, y:2, z:-10, rotY: Math.PI/2,  w:4, h:4, color:'#185418' },
      { x: 17.9, y:2, z: 0,  rotY:-Math.PI/2,  w:4, h:4, color:'#ad8e18' },
      { x: 17.9, y:2, z: 10, rotY:-Math.PI/2,  w:4, h:4, color:'#448744' },
      { x: 17.9, y:2, z:-10, rotY:-Math.PI/2,  w:4, h:4, color:'#875d2e' },
      { x: 0,    y:2, z:-17.9, rotY:0,          w:4, h:4, color:'#357535' },
      { x: 10,   y:2, z:-17.9, rotY:0,          w:4, h:4, color:'#664d1c' },
      { x:-10,   y:2, z:-17.9, rotY:0,          w:4, h:4, color:'#256625' },
      { x: 0,    y:2, z: 17.9, rotY:Math.PI,    w:4, h:4, color:'#559635' },
      { x: 10,   y:2, z: 17.9, rotY:Math.PI,    w:4, h:4, color:'#96662e' },
      { x:-10,   y:2, z: 17.9, rotY:Math.PI,    w:4, h:4, color:'#356635' },
    ],
    obstacles: [
      { x:8, z:5, w:2, h:6, d:2, color:'#ef4444' }, { x:-8, z:5, w:2, h:6, d:2, color:'#3b82f6' },
      { x:5, z:-8, w:2, h:6, d:2, color:'#f59e0b' }, { x:-5, z:-8, w:2, h:6, d:2, color:'#8b5cf6' },
      { x:0, z:0, w:3, h:4.5, d:3, color:'#22c55e' }, { x:10, z:-4, w:2, h:3.5, d:2, color:'#64748b' },
    ],
  },
  {
    id: 'space', name: 'Space Base', emoji: '🚀',
    fogColor: '#01020a', floorColor: '#040614', wallColor: '#06081c',
    panels: [
      { x:-17.9, y:2, z: 0,  rotY: Math.PI/2,  w:4, h:4, color:'#14149c' },
      { x:-17.9, y:2, z: 10, rotY: Math.PI/2,  w:4, h:4, color:'#9c149c' },
      { x:-17.9, y:2, z:-10, rotY: Math.PI/2,  w:4, h:4, color:'#149c9c' },
      { x: 17.9, y:2, z: 0,  rotY:-Math.PI/2,  w:4, h:4, color:'#5555bd' },
      { x: 17.9, y:2, z: 10, rotY:-Math.PI/2,  w:4, h:4, color:'#bd1455' },
      { x: 17.9, y:2, z:-10, rotY:-Math.PI/2,  w:4, h:4, color:'#14bd55' },
      { x: 0,    y:2, z:-17.9, rotY:0,          w:4, h:4, color:'#6622bd' },
      { x: 10,   y:2, z:-17.9, rotY:0,          w:4, h:4, color:'#bd6614' },
      { x:-10,   y:2, z:-17.9, rotY:0,          w:4, h:4, color:'#22bdbd' },
      { x: 0,    y:2, z: 17.9, rotY:Math.PI,    w:4, h:4, color:'#bd22bd' },
      { x: 10,   y:2, z: 17.9, rotY:Math.PI,    w:4, h:4, color:'#2266bd' },
      { x:-10,   y:2, z: 17.9, rotY:Math.PI,    w:4, h:4, color:'#bdbd22' },
    ],
    obstacles: [
      { x:6, z:6, w:2.5, h:3.5, d:2.5, color:'#f43f5e' }, { x:-6, z:6, w:2.5, h:3.5, d:2.5, color:'#0ea5e9' },
      { x:6, z:-6, w:2.5, h:3.5, d:2.5, color:'#eab308' }, { x:-6, z:-6, w:2.5, h:3.5, d:2.5, color:'#10b981' },
      { x:0, z:0, w:5, h:2, d:5, color:'#a855f7' }, { x:0, z:10, w:2.5, h:2.5, d:2.5, color:'#64748b' }, { x:0, z:-10, w:2.5, h:2.5, d:2.5, color:'#cbd5e1' },
    ],
  },
];

const GAME_DURATION = 90;
const rooms = new Map();

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
      id:p.id, username:p.username, ready:p.ready, score:p.score, hat:p.hat,
    })),
  });
}

function broadcastGame(room) {
  io.to(room.code).emit('game_tick', {
    players: [...room.players.values()].map(p => ({
      id:p.id, x:p.x, y:p.y, z:p.z, rotY:p.rotY,
      color:p.color, blendLevel:p.blendLevel,
      isChameleon:p.isChameleon, caught:p.caught,
      username:p.username, hat:p.hat, pose:p.pose||'stand',
    })),
    timer: room.timer,
  });
}

function startGame(room) {
  const players = [...room.players.values()];
  const hunter = pickRandom(players);
  const map  = MAPS.find(m=>m.id===room.mapId) || MAPS[0];

  const spawns = [
    {x:0,z:0},{x:6,z:6},{x:-6,z:6},{x:6,z:-6},{x:-6,z:-6},
    {x:0,z:10},{x:10,z:0},{x:-10,z:0},
  ];

  players.forEach((p, i) => {
    const sp = spawns[i % spawns.length];
    Object.assign(p, {
      isChameleon: p.id !== hunter.id,
      caught: false, blendLevel: 0,
      color: p.id !== hunter.id ? '#22c55e' : '#ef4444',
      x: sp.x, y: 0.9, z: sp.z, rotY: 0,
      pose: 'stand'
    });
    const sock = io.sockets.sockets.get(p.id);
    if (sock) sock.emit('role_info', { isChameleon: p.isChameleon, map });
  });

  room.phase      = 'hide_time';
  room.timer      = 15;
  room.hunterId   = hunter.id;

  io.to(room.code).emit('game_start', { map, mapId: room.mapId, phase: room.phase });
  broadcastGame(room);

  if (room.timerInterval) clearInterval(room.timerInterval);
  room.timerInterval = setInterval(() => {
    room.timer = Math.max(0, room.timer - 1);
    
    if (room.timer <= 0) {
      if (room.phase === 'hide_time') {
        room.phase = 'playing';
        room.timer = GAME_DURATION;
        io.to(room.code).emit('phase_change', { phase: 'playing' });
      } else if (room.phase === 'playing') {
        clearInterval(room.timerInterval); 
        room.timerInterval = null; 
        endGame(room, 'timeout', null);
      }
    }
  }, 1000);
}

function endGame(room, reason, catcherId) {
  if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
  room.phase = 'ended';
  const chameleonWins = reason === 'timeout';

  if (chameleonWins) {
    for (const p of room.players.values()) if (p.isChameleon) p.score += 3;
  } else {
    for (const p of room.players.values()) if (!p.isChameleon) p.score += 1;
    if (catcherId && room.players.has(catcherId)) room.players.get(catcherId).score += 2;
  }

  io.to(room.code).emit('game_end', {
    reason, chameleonWins,
    catcherName: catcherId ? room.players.get(catcherId)?.username : null,
    players: [...room.players.values()].map(p=>({id:p.id,username:p.username,score:p.score,isChameleon:p.isChameleon})),
  });
}

// ─────────────────────────────────────────────
//  SOCKET CLIENT EVENT REGISTRY
// ─────────────────────────────────────────────
io.on('connection', socket => {
  socket.on('create_room', ({username, mapId}, cb) => {
    const name = (username||'').trim().slice(0,20);
    if (!name) return cb({error:'Name required.'});
    const code = generateCode();
    const room = { code, hostId:socket.id, phase:'lobby', mapId:mapId||'arcade',
                   players:new Map(), timer:GAME_DURATION, timerInterval:null, chameleonId:null };
    room.players.set(socket.id,{id:socket.id,username:name,ready:false,score:0,
      x:0,y:0.9,z:0,rotY:0,color:'#3b82f6',blendLevel:0,isChameleon:false,caught:false,hat:'',pose:'stand'});
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
      x:0,y:0.9,z:0,rotY:0,color:'#3b82f6',blendLevel:0,isChameleon:false,caught:false,hat:'',pose:'stand'});
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

  socket.on('player_color', ({color}) => {
    const room = getRoom(socket); if (!room) return;
    const p = room.players.get(socket.id); if (!p) return;
    if (color && /^#[0-9a-fA-F]{6}$/.test(color)) p.color = color;
  });

  socket.on('player_pose', ({pose}) => {
    const room = getRoom(socket); if (!room) return;
    const p = room.players.get(socket.id); if (!p) return;
    p.pose = pose || 'stand';
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
    const room = getRoom(socket); if (!room) return;
    const p = room.players.get(socket.id); if (!p||p.caught) return;
    if (data.x !== undefined) p.x = data.x;
    if (data.y !== undefined) p.y = data.y;
    if (data.z !== undefined) p.z = data.z;
    if (data.rotY !== undefined) p.rotY = data.rotY;
    if (data.hat !== undefined) {
      p.hat = data.hat;
      if (room.phase === 'lobby') broadcastLobby(room);
    }
  });

  socket.on('chameleon_blend', ({blendLevel,color}) => {
    const room = getRoom(socket); if (!room||room.phase!=='playing') return;
    const p = room.players.get(socket.id); if (!p||!p.isChameleon) return;
    p.blendLevel = Math.max(0,Math.min(1,blendLevel));
    if (color) p.color = color;
  });

  socket.on('hunter_click', ({targetId}) => {
    const room = getRoom(socket); if (!room) return;
    const p = room.players.get(socket.id); if (!p||p.isChameleon) return;
    const tgt = room.players.get(targetId);
    if (tgt && tgt.isChameleon) {
      tgt.isChameleon = false;
      tgt.color = '#ef4444';
      tgt.pose = 'stand';
      io.to(room.code).emit('chat_msg',{sys:true,msg:`🚨 ${p.username} caught ${tgt.username}! They are now a Hunter!`});
      
      const chams = [...room.players.values()].filter(x => x.isChameleon);
      if (chams.length === 0) {
        endGame(room, 'caught', p.id);
      }
    }
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
      p.ready=false; p.isChameleon=false; p.caught=false; p.blendLevel=0; p.color='#3b82f6';
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

// 20hz TICK
setInterval(()=>{
  for (const room of rooms.values())
    if (room.phase==='playing') broadcastGame(room);
},50);

// STATIC FILES
app.use(express.static(path.join(__dirname,'public'),{
  setHeaders:(res,fp)=>{ if(fp.endsWith('.html')) res.setHeader('Content-Type','text/html;charset=utf-8'); }
}));
app.get('/',(req,res)=>{
  res.setHeader('Content-Type','text/html;charset=utf-8');
  res.sendFile(path.join(__dirname,'public','index.html'));
});

server.listen(PORT,()=>console.log(`\n&#x1F98E; Meccha Chameleon 3D on http://localhost:${PORT}\n`));
