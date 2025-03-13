class Game {
    constructor() {
        // Initialize THREE.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 20); // Set initial camera position
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000); // Set clear color to black
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add ground with texture
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundTexture = new THREE.TextureLoader().load(TextureGenerator.createGroundTexture());
        groundTexture.magFilter = THREE.NearestFilter;
        groundTexture.minFilter = THREE.NearestFilter;
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            map: groundTexture,
            side: THREE.DoubleSide
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = 0;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Initialize game state
        this.tanks = [];
        this.bullets = [];
        this.bombs = [];
        this.map = null;
        this.mode = null;
        this.gameStarted = false;
        this.teams = {
            red: { players: [], bombSite: null },
            blue: { players: [], bombSite: null }
        };

        // Camera settings for third person view
        this.cameraOffset = new THREE.Vector3(0, 10, 15);
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.playerTank = null;

        // Add keyboard state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Initialize effects system
        this.effects = new Effects(this.scene);

        // Add health display with health bar
        this.healthDisplay = document.createElement('div');
        this.healthDisplay.id = 'health-display';
        this.healthDisplay.style.position = 'absolute';
        this.healthDisplay.style.bottom = '20px';
        this.healthDisplay.style.left = '20px';
        this.healthDisplay.style.padding = '10px';
        this.healthDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.healthDisplay.style.borderRadius = '5px';
        this.healthDisplay.style.fontFamily = 'Arial, sans-serif';
        
        // Add health text
        this.healthText = document.createElement('div');
        this.healthText.style.color = 'white';
        this.healthText.style.fontSize = '24px';
        this.healthText.style.marginBottom = '5px';
        this.healthDisplay.appendChild(this.healthText);
        
        // Add health bar
        this.healthBar = document.createElement('div');
        this.healthBar.style.width = '200px';
        this.healthBar.style.height = '20px';
        this.healthBar.style.backgroundColor = '#333';
        this.healthBar.style.border = '2px solid #666';
        this.healthBar.style.borderRadius = '10px';
        this.healthBar.style.overflow = 'hidden';
        
        this.healthBarFill = document.createElement('div');
        this.healthBarFill.style.width = '100%';
        this.healthBarFill.style.height = '100%';
        this.healthBarFill.style.backgroundColor = '#00ff00';
        this.healthBarFill.style.transition = 'all 0.3s ease';
        
        this.healthBar.appendChild(this.healthBarFill);
        this.healthDisplay.appendChild(this.healthBar);
        
        document.body.appendChild(this.healthDisplay);

        // Add countdown display
        this.countdownTime = 10;
        this.gameActive = false;
        this.countdownElement = document.createElement('div');
        this.countdownElement.id = 'countdown';
        this.countdownElement.style.position = 'absolute';
        this.countdownElement.style.top = '50%';
        this.countdownElement.style.left = '50%';
        this.countdownElement.style.transform = 'translate(-50%, -50%)';
        this.countdownElement.style.fontSize = '48px';
        this.countdownElement.style.color = 'white';
        document.body.appendChild(this.countdownElement);
        this.countdownElement.style.display = 'none';

        // Add bomb action UI
        this.bombActionUI = document.createElement('div');
        this.bombActionUI.id = 'bomb-action-ui';
        this.bombActionUI.style.position = 'absolute';
        this.bombActionUI.style.top = '50%';
        this.bombActionUI.style.left = '50%';
        this.bombActionUI.style.transform = 'translate(-50%, -50%)';
        this.bombActionUI.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.bombActionUI.style.padding = '20px';
        this.bombActionUI.style.borderRadius = '10px';
        this.bombActionUI.style.display = 'none';
        this.bombActionUI.style.textAlign = 'center';
        this.bombActionUI.style.color = 'white';
        this.bombActionUI.style.fontFamily = 'Arial, sans-serif';
        
        // Add action text
        this.bombActionText = document.createElement('div');
        this.bombActionText.style.fontSize = '24px';
        this.bombActionText.style.marginBottom = '10px';
        this.bombActionUI.appendChild(this.bombActionText);
        
        // Add progress bar
        this.bombActionProgress = document.createElement('div');
        this.bombActionProgress.style.width = '200px';
        this.bombActionProgress.style.height = '20px';
        this.bombActionProgress.style.backgroundColor = '#333';
        this.bombActionProgress.style.border = '2px solid #666';
        this.bombActionProgress.style.borderRadius = '10px';
        this.bombActionProgress.style.overflow = 'hidden';
        
        this.bombActionProgressFill = document.createElement('div');
        this.bombActionProgressFill.style.width = '0%';
        this.bombActionProgressFill.style.height = '100%';
        this.bombActionProgressFill.style.backgroundColor = '#00ff00';
        this.bombActionProgressFill.style.transition = 'width 0.1s linear';
        
        this.bombActionProgress.appendChild(this.bombActionProgressFill);
        this.bombActionUI.appendChild(this.bombActionProgress);
        
        document.body.appendChild(this.bombActionUI);

        // Add win/lose popup
        this.winLosePopup = document.createElement('div');
        this.winLosePopup.id = 'win-lose-popup';
        this.winLosePopup.style.position = 'absolute';
        this.winLosePopup.style.top = '50%';
        this.winLosePopup.style.left = '50%';
        this.winLosePopup.style.transform = 'translate(-50%, -50%)';
        this.winLosePopup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.winLosePopup.style.padding = '20px';
        this.winLosePopup.style.borderRadius = '10px';
        this.winLosePopup.style.textAlign = 'center';
        this.winLosePopup.style.color = 'white';
        this.winLosePopup.style.fontFamily = 'Arial, sans-serif';
        this.winLosePopup.style.display = 'none';
        this.winLosePopup.style.zIndex = '1000';

        // Add result text
        this.winLoseText = document.createElement('div');
        this.winLoseText.style.fontSize = '36px';
        this.winLoseText.style.marginBottom = '20px';
        this.winLosePopup.appendChild(this.winLoseText);

        // Add restart button
        this.restartButton = document.createElement('button');
        this.restartButton.textContent = 'Play Again';
        this.restartButton.style.padding = '10px 20px';
        this.restartButton.style.fontSize = '20px';
        this.restartButton.style.cursor = 'pointer';
        this.restartButton.style.backgroundColor = '#4CAF50';
        this.restartButton.style.color = 'white';
        this.restartButton.style.border = 'none';
        this.restartButton.style.borderRadius = '5px';
        this.restartButton.onclick = () => {
            document.getElementById('menu').style.display = 'block';
            this.winLosePopup.style.display = 'none';
        };
        this.winLosePopup.appendChild(this.restartButton);

        document.body.appendChild(this.winLosePopup);

        // Start render loop
        this.animate();
    }

    start(mode) {
        this.mode = mode;
        this.gameStarted = true;
        this.gameActive = false;
        this.clearGame();
        
        // Create map with obstacles first
        this.map = new GameMap(this.scene, mode);
        
        // Wait for obstacles to be created
        setTimeout(() => {
            // Always assign player to red team for bomb mode
            const playerTeam = mode === 'bomb' ? 'red' : (Math.random() < 0.5 ? 'red' : 'blue');
            const enemyTeam = playerTeam === 'red' ? 'blue' : 'red';
            
            // Create player tank at team spawn position
            const playerSpawnPos = this.getSpawnPosition(playerTeam);
            const playerTank = new Tank(playerSpawnPos, playerTeam);
            this.tanks.push(playerTank);
            this.scene.add(playerTank.mesh);
            this.setPlayerTank(playerTank);
            this.teams[playerTeam].players.push(playerTank);
            
            // Add bot teammates with delay to prevent spawn conflicts
            const addTeammate = (index) => {
                if (index < 4) {
                    const teammatePos = this.getSpawnPosition(playerTeam);
                    const teammate = new Tank(teammatePos, playerTeam);
                    teammate.behavior = new BotBehavior(teammate, playerTeam);
                    this.tanks.push(teammate);
                    this.scene.add(teammate.mesh);
                    this.teams[playerTeam].players.push(teammate);
                    
                    // Add next teammate after a short delay
                    setTimeout(() => addTeammate(index + 1), 50);
                }
            };
            
            // Add enemy bots with delay
            const addEnemy = (index) => {
                if (index < 5) {
                    const enemyPos = this.getSpawnPosition(enemyTeam);
                    const enemy = new Tank(enemyPos, enemyTeam);
                    enemy.behavior = new BotBehavior(enemy, enemyTeam);
                    this.tanks.push(enemy);
                    this.scene.add(enemy.mesh);
                    this.teams[enemyTeam].players.push(enemy);
                    
                    // Add next enemy after a short delay
                    setTimeout(() => addEnemy(index + 1), 50);
                }
            };
            
            // Start adding bots with delays
            addTeammate(0);
            addEnemy(0);
            
            // Set up bomb sites for bomb mode
            if (mode === 'bomb') {
                // Create larger bomb sites
                const redSite = new THREE.Vector3(-35, 0, -35);
                const blueSite = new THREE.Vector3(35, 0, 35);
                
                this.teams.red.bombSite = redSite;
                this.teams.blue.bombSite = blueSite;
                
                // Add visual markers for bomb sites (larger radius)
                const siteGeometry = new THREE.CylinderGeometry(5, 5, 0.1, 32);
                
                const redMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0xff0000, 
                    opacity: 0.5, 
                    transparent: true 
                });
                const redSiteMesh = new THREE.Mesh(siteGeometry, redMaterial);
                redSiteMesh.position.copy(redSite);
                this.scene.add(redSiteMesh);
                
                const blueMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0x0000ff, 
                    opacity: 0.5, 
                    transparent: true 
                });
                const blueSiteMesh = new THREE.Mesh(siteGeometry, blueMaterial);
                blueSiteMesh.position.copy(blueSite);
                this.scene.add(blueSiteMesh);

                // Create and assign bomb to player if on red team
                this.bomb = new Bomb();
                if (playerTeam === 'red') {
                    this.bomb.carrier = this.playerTank;
                    this.playerTank.hasBomb = true;
                    this.bomb.mesh.position.copy(this.playerTank.mesh.position);
                    this.bomb.mesh.position.y = 1;
                    this.scene.add(this.bomb.mesh);
                }
            }

            // Start countdown
            this.startCountdown();
            
            // Hide menu
            document.getElementById('menu').style.display = 'none';
        }, 100);
    }

    startCountdown() {
        this.countdownElement.style.display = 'block';
        let timeLeft = this.countdownTime;
        
        const countdownInterval = setInterval(() => {
            if (timeLeft > 0) {
                this.countdownElement.textContent = timeLeft;
                timeLeft--;
            } else {
                this.countdownElement.style.display = 'none';
                this.gameActive = true;
                
                // Respawn all tanks at their team positions when countdown ends
                this.tanks.forEach(tank => {
                    const newPosition = this.getSpawnPosition(tank.team);
                    tank.mesh.position.copy(newPosition);
                    
                    // Set initial rotation based on team
                    if (tank.team === 'red') {
                        tank.mesh.rotation.y = Math.PI / 4; // Face towards center-right
                    } else {
                        tank.mesh.rotation.y = -3 * Math.PI / 4; // Face towards center-left
                    }
                });
                
                // Update camera immediately after repositioning tanks
                if (this.playerTank) {
                    this.updateCamera();
                }
                
                clearInterval(countdownInterval);
            }
        }, 1000);
    }

    getSpawnPosition(team) {
        // Define team areas more clearly with larger separation
        const spawnAreas = {
            red: {
                x: -35, // Further left
                z: -35, // Further back
                width: 20,
                depth: 20,
                minDistanceFromObstacles: 3
            },
            blue: {
                x: 35, // Further right
                z: 35, // Further forward
                width: 20,
                depth: 20,
                minDistanceFromObstacles: 3
            }
        };

        const area = spawnAreas[team];
        let position = null;
        let attempts = 0;
        const maxAttempts = 50;

        // Keep trying to find a valid position
        while (attempts < maxAttempts) {
            // Generate random position within team's area
            const randomX = area.x + (Math.random() - 0.5) * area.width;
            const randomZ = area.z + (Math.random() - 0.5) * area.depth;
            const testPosition = new THREE.Vector3(randomX, 1, randomZ);

            // Check if position is valid
            if (this.isValidSpawnPosition(testPosition, area.minDistanceFromObstacles)) {
                position = testPosition;
                break;
            }

            attempts++;
        }

        // If no valid position found, use fallback position at area center
        if (!position) {
            position = new THREE.Vector3(area.x, 1, area.z);
        }

        return position;
    }

    isValidSpawnPosition(position, minDistance) {
        // Check distance from obstacles
        if (this.map && this.map.obstacles) {
            for (const obstacle of this.map.obstacles) {
                const distance = position.distanceTo(obstacle.position);
                if (distance < minDistance) {
                    return false;
                }
            }
        }

        // Check distance from other tanks
        for (const tank of this.tanks) {
            const distance = position.distanceTo(tank.mesh.position);
            if (distance < minDistance) {
                return false;
            }
        }

        return true;
    }

    clearGame() {
        // Remove all tanks
        this.tanks.forEach(tank => {
            if (tank.mesh) {
                this.scene.remove(tank.mesh);
            }
        });
        this.tanks = [];

        // Remove all bullets
        this.bullets.forEach(bullet => {
            if (bullet.mesh) {
                this.scene.remove(bullet.mesh);
            }
        });
        this.bullets = [];

        // Remove all bombs
        this.bombs.forEach(bomb => {
            if (bomb.mesh) {
                this.scene.remove(bomb.mesh);
            }
        });
        this.bombs = [];

        // Clear map
        if (this.map) {
            this.map.clearMap();
            this.map = null;
        }

        // Reset teams
        this.teams.red.players = [];
        this.teams.blue.players = [];
        this.teams.red.bombSite = null;
        this.teams.blue.bombSite = null;
    }

    setPlayerTank(tank) {
        this.playerTank = tank;
        
        // Set up keyboard controls
        const keyState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            plant: false,
            defuse: false
        };

        document.addEventListener('keydown', (event) => {
            if (!this.gameActive || this.playerTank.isDead) return;
            
            switch (event.code) {
                case 'KeyW':
                    keyState.forward = true;
                    break;
                case 'KeyS':
                    keyState.backward = true;
                    break;
                case 'KeyA':
                    keyState.left = true;
                    this.playerTank.move('left');
                    break;
                case 'KeyD':
                    keyState.right = true;
                    this.playerTank.move('right');
                    break;
                case 'Space':
                    this.playerTank.fire();
                    break;
                case 'KeyE':
                    keyState.plant = true;
                    break;
                case 'KeyF':
                    keyState.defuse = true;
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                    keyState.forward = false;
                    break;
                case 'KeyS':
                    keyState.backward = false;
                    break;
                case 'KeyA':
                    keyState.left = false;
                    this.playerTank.move('stop_left');
                    break;
                case 'KeyD':
                    keyState.right = false;
                    this.playerTank.move('stop_right');
                    break;
                case 'KeyE':
                    keyState.plant = false;
                    break;
                case 'KeyF':
                    keyState.defuse = false;
                    break;
            }
        });

        // Store keyState for use in animate
        this.keyState = keyState;
    }

    updateCamera() {
        if (this.playerTank && this.playerTank.mesh) {
            // Get tank's position
            const tankPosition = this.playerTank.mesh.position;

            // Calculate camera position based on tank's position and rotation
            const cameraAngle = this.playerTank.mesh.rotation.y;
            const offsetX = Math.sin(cameraAngle) * -15;
            const offsetZ = Math.cos(cameraAngle) * -15;

            // Set camera position
            this.camera.position.x = tankPosition.x + offsetX;
            this.camera.position.y = tankPosition.y + 10;
            this.camera.position.z = tankPosition.z + offsetZ;

            // Look at tank's position
            this.camera.lookAt(
                tankPosition.x,
                tankPosition.y + 2,
                tankPosition.z
            );
        }
    }

    updateHealthDisplay() {
        if (this.playerTank) {
            // Update health text
            this.healthText.textContent = `Health: ${this.playerTank.health}`;
            
            // Update health bar
            const healthPercent = (this.playerTank.health / 100) * 100;
            this.healthBarFill.style.width = `${healthPercent}%`;
            
            // Change color based on health
            if (this.playerTank.health > 70) {
                this.healthBarFill.style.backgroundColor = '#00ff00'; // Green
            } else if (this.playerTank.health > 30) {
                this.healthBarFill.style.backgroundColor = '#ffff00'; // Yellow
            } else {
                this.healthBarFill.style.backgroundColor = '#ff0000'; // Red
            }
        }
    }

    handleTankHit(tank, damage) {
        if (tank && !tank.isDead) {
            tank.health -= damage;
            
            // Create hit effect
            this.effects.createHitSpark(tank.mesh.position.clone());
            
            // Screen shake effect when player is hit
            if (tank === this.playerTank) {
                this.shakeCamera();
                // Flash the health display red
                this.healthDisplay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                setTimeout(() => {
                    this.healthDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                }, 100);
            }
            
            // Create smoke if health is low
            if (tank.health < 50) {
                this.effects.createSmoke(tank.mesh.position.clone());
            }
            
            // Tank destroyed
            if (tank.health <= 0) {
                tank.isDead = true;
                this.effects.createExplosion(tank.mesh.position.clone());
                
                // Remove tank after explosion
                setTimeout(() => {
                    this.scene.remove(tank.mesh);
                    this.tanks = this.tanks.filter(t => t !== tank);
                }, 1000);
            }
            
            // Update health display if it's the player's tank
            if (tank === this.playerTank) {
                this.updateHealthDisplay();
            }
        }
    }

    shakeCamera() {
        const originalPosition = this.camera.position.clone();
        const shakeAmount = 0.5;
        const shakeDuration = 100;
        const startTime = Date.now();

        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < shakeDuration) {
                this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeAmount;
                this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeAmount;
                this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeAmount;
                requestAnimationFrame(shake);
            } else {
                this.camera.position.copy(originalPosition);
            }
        };

        shake();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (!this.gameActive) return;

        // Update player tank based on key state
        if (this.playerTank && !this.playerTank.isDead) {
            if (this.keyState.forward) this.playerTank.move('forward');
            if (this.keyState.backward) this.playerTank.move('backward');
            if (this.keyState.left) this.playerTank.move('left');
            if (this.keyState.right) this.playerTank.move('right');

            // Handle bomb planting/defusing
            if (this.mode === 'bomb' && this.bomb) {
                if (this.keyState.plant) {
                    if (!this.bomb.plantStartTime && this.bomb.startPlanting(this.playerTank)) {
                        this.showBombAction('Planting Bomb...', 0);
                    }
                    const plantProgress = this.bomb.continuePlanting();
                    if (typeof plantProgress === 'number') {
                        this.showBombAction('Planting Bomb...', plantProgress);
                        if (plantProgress >= 1) {
                            this.hideBombAction();
                            this.endRound('red');
                        }
                    }
                } else if (this.keyState.defuse) {
                    if (!this.bomb.defuseStartTime && this.bomb.startDefusing(this.playerTank)) {
                        this.showBombAction('Defusing Bomb...', 0);
                    }
                    const defuseProgress = this.bomb.continueDefusing();
                    if (typeof defuseProgress === 'number') {
                        this.showBombAction('Defusing Bomb...', defuseProgress);
                        if (defuseProgress >= 1) {
                            this.hideBombAction();
                            this.endRound('blue');
                        }
                    }
                } else {
                    this.bomb.cancelAction();
                    this.hideBombAction();
                }
            }
        }

        // Update all tanks and their behaviors
        for (const tank of this.tanks) {
            if (!tank.isDead) {
                tank.update();
                // Update bot behavior if it exists
                if (tank.behavior) {
                    tank.behavior.update();
                }
            }
        }

        // Update bomb in bomb mode
        if (this.mode === 'bomb' && this.bomb) {
            this.bomb.update();
            
            // Check if bomb has exploded
            if (this.bomb.isPlanted && this.bomb.explosionTime <= 0) {
                this.endRound('red');
            }
        }

        // Always render the scene and update camera
        if (this.playerTank && this.playerTank.mesh) {
            this.updateCamera();
        }
        this.renderer.render(this.scene, this.camera);

        if (this.gameStarted && this.gameActive) {
            // Update effects
            this.effects.update();
            
            // Update and remove dead bullets
            this.bullets = this.bullets.filter(bullet => {
                bullet.update();
                
                // Check for collisions with tanks
                this.tanks.forEach(tank => {
                    if (!tank.isDead && bullet.team !== tank.team) {
                        const distance = bullet.mesh.position.distanceTo(tank.mesh.position);
                        if (distance < 2) { // Hit detection radius
                            this.handleTankHit(tank, 20); // 20 damage per hit
                            bullet.isDead = true;
                        }
                    }
                });
                
                if (bullet.isDead) {
                    this.scene.remove(bullet.mesh);
                    return false;
                }
                return true;
            });
        }
    }

    showBombAction(action, progress) {
        this.bombActionUI.style.display = 'block';
        this.bombActionText.textContent = action;
        this.bombActionProgressFill.style.width = `${progress * 100}%`;
        
        // Change color based on action
        if (action.includes('Planting')) {
            this.bombActionProgressFill.style.backgroundColor = '#ff0000';
        } else if (action.includes('Defusing')) {
            this.bombActionProgressFill.style.backgroundColor = '#00ff00';
        }
    }

    hideBombAction() {
        this.bombActionUI.style.display = 'none';
    }

    endRound(winningTeam) {
        this.gameActive = false;
        this.winLosePopup.style.display = 'block';
        
        if (winningTeam === this.playerTank.team) {
            this.winLoseText.textContent = 'You Win!';
            this.winLoseText.style.color = '#4CAF50';
        } else {
            this.winLoseText.textContent = 'You Lose!';
            this.winLoseText.style.color = '#ff0000';
        }
    }

    handleKeyDown(event) {
        if (!this.gameActive) return;
        
        switch(event.key.toLowerCase()) {
            case 'w':
                this.playerTank.move('forward');
                break;
            case 's':
                this.playerTank.move('backward');
                break;
            case 'a':
                this.playerTank.move('left');
                break;
            case 'd':
                this.playerTank.move('right');
                break;
            case 'f':
                if (this.bomb) {
                    if (this.playerTank.hasBomb) {
                        this.bomb.startPlanting(this.playerTank);
                    } else if (this.bomb.isPlanted) {
                        this.bomb.startDefusing(this.playerTank);
                    }
                }
                break;
        }
    }

    handleKeyUp(event) {
        if (!this.gameActive) return;
        
        switch(event.key.toLowerCase()) {
            case 'a':
                this.playerTank.move('stop_left');
                break;
            case 'd':
                this.playerTank.move('stop_right');
                break;
            case 'f':
                if (this.bomb) {
                    this.bomb.cancelAction();
                }
                break;
        }
    }
} 