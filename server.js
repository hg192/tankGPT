const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const fs = require('fs');
const path = require('path');

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve Socket.IO client
app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules/socket.io/client-dist/socket.io.js'));
});

// Game state
const gameState = {
    players: new Map(),
    tanks: [],
    bullets: [],
    teams: {
        red: { players: [], score: 0 },
        blue: { players: [], score: 0 }
    }
};

// Lobby state
const lobbyState = {
    players: {
        red: [],
        blue: []
    },
    gameStarted: false
};

// Handle socket connections
io.on('connection', (socket) => {
    console.log('New client connected');
    let playerId = null;
    let playerName = '';
    let playerTeam = null;

    socket.on('join_lobby', (data) => {
        console.log('Player joined lobby:', data);
        playerName = data.playerName;
        playerId = generatePlayerId();
        
        // Send initial lobby state
        socket.emit('lobby_state', {
            state: lobbyState,
            playerId: playerId
        });
        console.log('Sent initial lobby state:', lobbyState);
    });

    socket.on('select_team', (data) => {
        console.log('Team selection:', data);
        if (!playerId) {
            console.log('No player ID found');
            return;
        }

        const team = data.team;
        if (!['red', 'blue'].includes(team)) {
            console.log('Invalid team selected');
            return;
        }

        // Remove player from current team if any
        if (playerTeam) {
            lobbyState.players[playerTeam] = lobbyState.players[playerTeam].filter(p => p.id !== playerId);
        }

        // Add player to new team
        playerTeam = team;
        lobbyState.players[team].push({
            id: playerId,
            name: playerName,
            ready: false
        });

        console.log('Updated lobby state:', lobbyState);
        io.emit('lobby_state', { state: lobbyState });
    });

    socket.on('player_ready', () => {
        console.log('Player ready:', playerId);
        if (!playerId || !playerTeam) {
            console.log('No player ID or team found');
            return;
        }

        const player = lobbyState.players[playerTeam].find(p => p.id === playerId);
        if (player) {
            player.ready = true;
            console.log('Updated player ready status:', player);
            io.emit('lobby_state', { state: lobbyState });

            // Check if all players are ready
            if (canStartGame()) {
                console.log('All players ready, starting game');
                startGame();
            }
        }
    });

    socket.on('start_game', () => {
        if (!lobbyState.gameStarted && canStartGame()) {
            startGame();
        }
    });

    socket.on('player_update', (data) => {
        const player = gameState.players.get(playerId);
        if (!player) return;

        player.position = data.position;
        player.rotation = data.rotation;

        io.emit('game_state', { state: gameState });
    });

    socket.on('projectile_fired', (data) => {
        const player = gameState.players.get(playerId);
        if (!player) return;

        const projectile = {
            id: generateProjectileId(),
            playerId: playerId,
            position: data.position,
            direction: data.direction,
            team: player.team
        };

        gameState.bullets.push(projectile);
        io.emit('game_state', { state: gameState });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', playerId);
        if (playerId) {
            // Remove player from game state
            gameState.players.delete(playerId);
            
            // Remove player from lobby state
            if (playerTeam) {
                lobbyState.players[playerTeam] = lobbyState.players[playerTeam].filter(p => p.id !== playerId);
            }

            // Broadcast updated states
            io.emit('lobby_state', { state: lobbyState });
            io.emit('game_state', { state: gameState });
        }
    });

    function canStartGame() {
        return lobbyState.players.red.length > 0 && 
               lobbyState.players.blue.length > 0 &&
               lobbyState.players.red.every(p => p.ready) &&
               lobbyState.players.blue.every(p => p.ready);
    }

    function startGame() {
        lobbyState.gameStarted = true;
        
        // Initialize game state
        gameState.players.clear();
        gameState.tanks = [];
        gameState.bullets = [];
        gameState.teams = {
            red: { players: [], score: 0 },
            blue: { players: [], score: 0 }
        };

        // Add players to game state
        Object.entries(lobbyState.players).forEach(([team, players]) => {
            players.forEach(player => {
                gameState.players.set(player.id, {
                    name: player.name,
                    team: team,
                    position: getSpawnPosition(team)
                });
                gameState.teams[team].players.push(player.id);
            });
        });

        // Broadcast game start to all clients
        io.emit('game_start', { gameState: gameState });
    }

    function generatePlayerId() {
        return Math.random().toString(36).substr(2, 9);
    }

    function generateProjectileId() {
        return Math.random().toString(36).substr(2, 9);
    }

    function getSpawnPosition(team) {
        const spawnPoints = {
            red: [
                { x: -40, z: -40 },
                { x: -40, z: -30 },
                { x: -30, z: -40 }
            ],
            blue: [
                { x: 40, z: 40 },
                { x: 40, z: 30 },
                { x: 30, z: 40 }
            ]
        };

        const points = spawnPoints[team];
        const randomPoint = points[Math.floor(Math.random() * points.length)];
        return {
            x: randomPoint.x,
            y: 0,
            z: randomPoint.z
        };
    }
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 