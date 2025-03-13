// Initialize game instance
let gameInstance = null;
window.gameInstance = null; // Add global reference

// Initialize socket connection
const socket = io();

// Game state
const gameState = {
    players: new Map(),
    bullets: new Map(),
    map: null,
    mode: null,
    player: null,
    bomb: null,
    playerTank: null,
    playerTeam: null
};

// Start game function
function startGame(mode) {
    if (!gameInstance) {
        gameInstance = new Game();
        window.gameInstance = gameInstance; // Update global reference
    }
    gameInstance.start(mode);
    
    // Sync game state
    gameState.mode = mode;
    gameState.map = gameInstance.map;
    gameState.playerTank = gameInstance.playerTank;
    gameState.playerTeam = gameInstance.playerTank.team;
}

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('playerJoined', (playerData) => {
    if (playerData.id !== socket.id) {
        addPlayer(playerData);
    }
});

socket.on('playerLeft', (playerId) => {
    removePlayer(playerId);
});

socket.on('tankMove', (data) => {
    if (data.id !== socket.id) {
        const player = gameState.players.get(data.id);
        if (player) {
            player.position.copy(data.position);
            player.rotation = data.rotation;
        }
    }
});

socket.on('tankFire', (data) => {
    if (data.id !== socket.id) {
        const player = gameState.players.get(data.id);
        if (player) {
            const bullet = new Bullet(data.bullet.position, data.bullet.rotation, data.bullet.team);
            gameInstance.bullets.push(bullet);
        }
    }
});

socket.on('tankDestroyed', (data) => {
    const player = gameState.players.get(data.id);
    if (player) {
        player.destroy();
    }
});

socket.on('bombPlanted', (data) => {
    if (data.id !== socket.id) {
        const bomb = new Bomb(data.position, data.team);
        gameInstance.bombs.push(bomb);
    }
});

socket.on('bombDefused', (data) => {
    if (data.id !== socket.id) {
        const bomb = gameInstance.bombs.find(b => b.position.equals(data.position));
        if (bomb) {
            bomb.defuse();
        }
    }
});

socket.on('bombExploded', (data) => {
    const bomb = gameInstance.bombs.find(b => b.position.equals(data.position));
    if (bomb) {
        bomb.explode();
    }
});

// Keyboard controls
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    plantBomb: false
};

document.addEventListener('keydown', (event) => {
    switch(event.code) {
        case 'KeyW':
            keys.forward = true;
            break;
        case 'KeyS':
            keys.backward = true;
            break;
        case 'KeyA':
            keys.left = true;
            break;
        case 'KeyD':
            keys.right = true;
            break;
        case 'Space':
            if (gameState.playerTank) {
                gameState.playerTank.fire();
            }
            break;
        case 'KeyF':
            keys.plantBomb = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch(event.code) {
        case 'KeyW':
            keys.forward = false;
            break;
        case 'KeyS':
            keys.backward = false;
            break;
        case 'KeyA':
            keys.left = false;
            break;
        case 'KeyD':
            keys.right = false;
            break;
        case 'KeyF':
            keys.plantBomb = false;
            break;
    }
});

// Game loop
function gameLoop() {
    if (gameState.playerTank && gameInstance.gameStarted) {
        // Handle player movement
        if (keys.forward) {
            gameState.playerTank.move('forward');
        }
        if (keys.backward) {
            gameState.playerTank.move('backward');
        }
        if (keys.left) {
            gameState.playerTank.move('left');
        }
        if (keys.right) {
            gameState.playerTank.move('right');
        }

        // Update player mesh position and rotation
        if (gameState.playerTank.mesh) {
            gameState.playerTank.update();
            
            // Emit position update
            socket.emit('tankMove', {
                id: socket.id,
                position: gameState.playerTank.position,
                rotation: gameState.playerTank.rotation
            });
        }
        
        // Handle bomb planting
        if (keys.plantBomb && gameInstance.mode === 'bomb') {
            const player = gameState.playerTank;
            if (player.team === 'red' && gameInstance.bomb && gameInstance.bomb.carrier === player) {
                const blueSite = gameInstance.teams.blue.bombSite;
                if (blueSite) {
                    const distance = player.position.distanceTo(blueSite);
                    
                    if (distance < 3) { // Within 3 units of bomb site
                        if (!gameInstance.bomb.isPlanted) {
                            if (!gameInstance.bomb.plantStartTime) {
                                gameInstance.bomb.startPlanting(player);
                                gameInstance.showBombAction('Planting Bomb...', 0);
                            } else {
                                const progress = gameInstance.bomb.continuePlanting();
                                if (typeof progress === 'number') {
                                    gameInstance.showBombAction('Planting Bomb...', progress);
                                    if (progress >= 1) {
                                        gameInstance.hideBombAction();
                                        socket.emit('bombPlanted', {
                                            id: socket.id,
                                            position: player.position.clone(),
                                            team: player.team
                                        });
                                    }
                                }
                            }
                        }
                    } else {
                        gameInstance.bomb.cancelAction();
                        gameInstance.hideBombAction();
                    }
                }
            }
        } else {
            // Cancel bomb planting if F key is released
            if (gameInstance.bomb) {
                gameInstance.bomb.cancelAction();
                gameInstance.hideBombAction();
            }
        }
    }

    // Update bot behaviors
    gameState.players.forEach((player, id) => {
        if (id !== socket.id && player.behavior) {
            player.behavior.update();
            if (player.mesh) {
                player.update();
            }
        }
    });

    requestAnimationFrame(gameLoop);
}

// Add player function
function addPlayer(playerData) {
    const tank = new Tank(playerData.id, playerData.position, playerData.team);
    gameInstance.scene.add(tank.mesh); // Add tank mesh to scene
    gameState.players.set(playerData.id, tank);
    gameInstance.tanks.push(tank);
    gameInstance.teams[playerData.team].players.push(tank);

    // Add bot behavior for non-player tanks
    if (playerData.id !== socket.id) {
        tank.behavior = new BotBehavior(tank, playerData.team);
    }
}

// Remove player function
function removePlayer(playerId) {
    const player = gameState.players.get(playerId);
    if (player) {
        gameInstance.scene.remove(player.mesh); // Remove tank mesh from scene
        player.destroy();
        gameState.players.delete(playerId);
        gameInstance.tanks = gameInstance.tanks.filter(t => t.id !== playerId);
        gameInstance.teams[player.team].players = gameInstance.teams[player.team].players.filter(p => p.id !== playerId);
    }
}

// Start game loop
gameLoop(); 