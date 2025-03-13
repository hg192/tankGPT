class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = null;
        this.playerId = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.maxPlayersPerTeam = 5;
    }

    connect() {
        try {
            // Use native WebSocket instead of Socket.IO
            this.ws = new WebSocket('ws://localhost:8080');
            
            this.ws.onopen = () => {
                console.log('Connected to server');
                this.connected = true;
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('Disconnected from server');
                this.connected = false;
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Connection error:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'init':
                this.playerId = data.playerId;
                console.log('Received player ID:', this.playerId);
                break;
            case 'game_state':
                this.handleGameState(data.state);
                break;
        }
    }

    handleGameState(state) {
        // Update other players' tanks
        state.tanks.forEach(tankData => {
            if (tankData.id !== this.playerId) {
                this.updateOtherPlayerTank(tankData);
            }
        });

        // Update bullets
        state.bullets.forEach(bulletData => {
            if (!this.game.bullets.find(b => b.id === bulletData.id)) {
                this.createBullet(bulletData);
            }
        });

        // Update bot count based on player count
        this.updateBotCount(state.tanks);
    }

    updateBotCount(players) {
        // Count players in each team
        const redPlayers = players.filter(p => p.team === 'red').length;
        const bluePlayers = players.filter(p => p.team === 'blue').length;

        // Update bot count for each team
        this.game.updateTeamBots('red', this.maxPlayersPerTeam - redPlayers);
        this.game.updateTeamBots('blue', this.maxPlayersPerTeam - bluePlayers);
    }

    updateOtherPlayerTank(tankData) {
        let otherTank = this.game.tanks.find(t => t.id === tankData.id);
        
        if (!otherTank) {
            // Create new tank for other player
            otherTank = new Tank(tankData.position, tankData.team, false, tankData.playerName);
            otherTank.id = tankData.id;
            
            // Add glow effect for other players' tanks
            const glowMaterial = new THREE.MeshPhongMaterial({
                color: tankData.team === 'red' ? 0xff0000 : 0x0000ff,
                emissive: tankData.team === 'red' ? 0xff0000 : 0x0000ff,
                emissiveIntensity: 0.2,
                transparent: true,
                opacity: 0.8
            });
            
            // Apply glow to tank body
            otherTank.mesh.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.material = glowMaterial;
                }
            });
            
            // Add player name label
            if (tankData.playerName) {
                otherTank.createNameLabel();
            }
            
            this.game.tanks.push(otherTank);
            this.game.scene.add(otherTank.mesh);

            // Remove a bot from the same team
            this.removeBotFromTeam(tankData.team);
        } else {
            // Update existing tank
            otherTank.mesh.position.set(
                tankData.position.x,
                tankData.position.y,
                tankData.position.z
            );
            otherTank.mesh.rotation.y = tankData.rotation;
            
            // Update name label if it exists
            if (otherTank.nameLabel) {
                otherTank.nameLabel.position.y = 2.5;
                otherTank.nameLabel.visible = true;
            }
        }
    }

    removeBotFromTeam(team) {
        // Find a bot from the same team
        const botIndex = this.game.tanks.findIndex(tank => 
            tank.team === team && 
            !tank.id && // Bots don't have IDs
            tank !== this.game.playerTank
        );

        if (botIndex !== -1) {
            // Remove the bot
            const bot = this.game.tanks[botIndex];
            this.game.scene.remove(bot.mesh);
            this.game.tanks.splice(botIndex, 1);
        }
    }

    createBullet(bulletData) {
        const bullet = new Bullet(
            new THREE.Vector3(bulletData.position.x, bulletData.position.y, bulletData.position.z),
            bulletData.team
        );
        bullet.id = bulletData.id;
        this.game.bullets.push(bullet);
        this.game.scene.add(bullet.mesh);
    }

    joinGame(team) {
        if (this.connected) {
            this.ws.send(JSON.stringify({
                type: 'join_game',
                team: team,
                playerName: this.game.playerName
            }));
        }
    }

    sendTankUpdate(position, rotation) {
        if (this.connected) {
            this.ws.send(JSON.stringify({
                type: 'tank_update',
                position: {
                    x: position.x,
                    y: position.y,
                    z: position.z
                },
                rotation: rotation
            }));
        }
    }

    sendFire() {
        if (this.connected) {
            this.ws.send(JSON.stringify({
                type: 'fire'
            }));
        }
    }

    sendPlantBomb() {
        if (this.connected) {
            this.ws.send(JSON.stringify({
                type: 'plant_bomb'
            }));
        }
    }

    sendDefuseBomb() {
        if (this.connected) {
            this.ws.send(JSON.stringify({
                type: 'defuse_bomb'
            }));
        }
    }
} 