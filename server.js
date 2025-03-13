const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve JavaScript files with correct MIME type
app.use('/js', express.static(__dirname + '/js', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Game state
const gameState = {
    players: new Map(),
    rooms: new Map(),
    nextPlayerId: 1
};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle player joining
    socket.on('join', (data) => {
        const playerData = {
            id: socket.id,
            position: data.position,
            team: data.team
        };
        socket.broadcast.emit('playerJoined', playerData);
    });

    // Handle tank movement
    socket.on('tankMove', (data) => {
        socket.broadcast.emit('tankMove', data);
    });

    // Handle tank firing
    socket.on('tankFire', (data) => {
        socket.broadcast.emit('tankFire', data);
    });

    // Handle tank destruction
    socket.on('tankDestroyed', (data) => {
        socket.broadcast.emit('tankDestroyed', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
        io.emit('playerLeft', socket.id);
    });
});

// Join bomb mode room
function joinBombMode(player) {
    let room = null;
    
    // Find available room or create new one
    for (const [roomId, roomData] of gameState.rooms) {
        if (roomData.mode === 'bomb' && roomData.players.length < 10) {
            room = roomId;
            break;
        }
    }
    
    if (!room) {
        room = `bomb_${Date.now()}`;
        gameState.rooms.set(room, {
            mode: 'bomb',
            players: [],
            redTeam: [],
            blueTeam: []
        });
    }
    
    // Assign team
    const roomData = gameState.rooms.get(room);
    if (roomData.redTeam.length <= roomData.blueTeam.length) {
        player.team = 'red';
        roomData.redTeam.push(player.id);
    } else {
        player.team = 'blue';
        roomData.blueTeam.push(player.id);
    }
    
    // Join room
    player.socket.join(room);
    player.room = room;
    roomData.players.push(player.id);
    
    // Broadcast player joined
    player.socket.to(room).emit('playerJoined', {
        id: player.id,
        position: player.position,
        rotation: player.rotation,
        team: player.team
    });
}

// Join battle mode room
function joinBattleMode(player) {
    let room = null;
    
    // Find available room or create new one
    for (const [roomId, roomData] of gameState.rooms) {
        if (roomData.mode === 'battle' && roomData.players.length < 20) {
            room = roomId;
            break;
        }
    }
    
    if (!room) {
        room = `battle_${Date.now()}`;
        gameState.rooms.set(room, {
            mode: 'battle',
            players: []
        });
    }
    
    // Join room
    player.socket.join(room);
    player.room = room;
    gameState.rooms.get(room).players.push(player.id);
    
    // Broadcast player joined
    player.socket.to(room).emit('playerJoined', {
        id: player.id,
        position: player.position,
        rotation: player.rotation
    });
}

// Check game end conditions
function checkGameEnd(roomId) {
    const room = gameState.rooms.get(roomId);
    if (!room) return;
    
    if (room.mode === 'bomb') {
        // Check if one team is eliminated
        if (room.redTeam.length === 0) {
            io.to(roomId).emit('gameEnd', { winner: 'blue' });
            gameState.rooms.delete(roomId);
        } else if (room.blueTeam.length === 0) {
            io.to(roomId).emit('gameEnd', { winner: 'red' });
            gameState.rooms.delete(roomId);
        }
    } else {
        // Battle mode: check if only one player remains
        const alivePlayers = room.players.filter(id => gameState.players.has(id));
        if (alivePlayers.length <= 1) {
            io.to(roomId).emit('gameEnd', { winner: alivePlayers[0] });
            gameState.rooms.delete(roomId);
        }
    }
}

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 