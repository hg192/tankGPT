class Tank {
    constructor(position, team, isPlayer = false, playerName = '') {
        this.position = position;
        this.team = team;
        this.health = 100;
        this.isDead = false;
        this.moveSpeed = 0.15;
        this.rotateSpeed = 0.015;
        this.mesh = this.createMesh();
        this.boundingBox = null;
        this.updateBoundingBox();
        
        // Add movement state
        this.velocity = new THREE.Vector3();
        this.angularVelocity = 0;
        this.friction = 0.9;
        this.angularFriction = 0.85;
        this.maxSpeed = 0.3;
        this.rotationSpeed = 0.05;
        this.isRotating = false;
        this.rotationDirection = 0;
        this.isPlayer = isPlayer;
        this.lastFireTime = 0;
        this.fireRate = 500; // Assuming a default fireRate
        
        // Add player name display
        this.playerName = playerName;
        this.nameLabel = null;
        if (playerName) {
            this.createNameLabel();
        }
    }

    createMesh() {
        // Create tank body
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: this.team === 'red' ? 0xff0000 : 0x0000ff 
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

        // Create tank turret
        const turretGeometry = new THREE.BoxGeometry(1.5, 0.75, 1.5);
        const turret = new THREE.Mesh(turretGeometry, bodyMaterial);
        turret.position.y = 0.875;
        body.add(turret);

        // Create tank barrel
        const barrelGeometry = new THREE.BoxGeometry(0.3, 0.3, 2);
        const barrel = new THREE.Mesh(barrelGeometry, bodyMaterial);
        barrel.position.z = 1;
        turret.add(barrel);

        // Set initial position
        body.position.copy(this.position);

        // Enable shadows
        body.castShadow = true;
        body.receiveShadow = true;
        turret.castShadow = true;
        barrel.castShadow = true;

        return body;
    }

    updateBoundingBox() {
        if (!this.mesh) return;
        this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
    }

    move(direction) {
        if (this.isDead) return;

        switch (direction) {
            case 'forward':
                this.velocity.x += Math.sin(this.mesh.rotation.y) * this.moveSpeed;
                this.velocity.z += Math.cos(this.mesh.rotation.y) * this.moveSpeed;
                break;
            case 'backward':
                this.velocity.x -= Math.sin(this.mesh.rotation.y) * this.moveSpeed;
                this.velocity.z -= Math.cos(this.mesh.rotation.y) * this.moveSpeed;
                break;
            case 'left':
                this.isRotating = true;
                this.rotationDirection = -1;
                break;
            case 'right':
                this.isRotating = true;
                this.rotationDirection = 1;
                break;
            case 'stop_left':
            case 'stop_right':
                this.isRotating = false;
                this.rotationDirection = 0;
                break;
        }

        // Limit velocity
        const speed = this.velocity.length();
        if (speed > this.maxSpeed) {
            this.velocity.multiplyScalar(this.maxSpeed / speed);
        }
    }

    fire() {
        if (!this.isDead && this.lastFireTime + this.fireRate <= Date.now()) {
            // Play firing sound
            gameInstance.audio.playTankFire();
            
            // Create bullet
            const bullet = new Bullet(this, this.team);
            
            // Add bullet to game
            gameInstance.bullets.push(bullet);
            gameInstance.scene.add(bullet.mesh);
            
            // Update last fire time
            this.lastFireTime = Date.now();
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.health -= amount;
        gameInstance.effects.createHitSpark(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));

        if (this.health <= 50) {
            gameInstance.effects.createSmoke(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
        }

        if (this.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        this.isDead = true;
        gameInstance.effects.createExplosion(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
        
        setTimeout(() => {
            gameInstance.scene.remove(this.mesh);
            const index = gameInstance.tanks.indexOf(this);
            if (index > -1) {
                gameInstance.tanks.splice(index, 1);
            }
        }, 1000);
    }

    update() {
        if (this.isDead) return;

        const oldPosition = this.mesh.position.clone();
        const oldRotation = this.mesh.rotation.y;

        // Apply velocity
        this.mesh.position.x += this.velocity.x;
        this.mesh.position.z += this.velocity.z;

        // Handle rotation
        if (this.isRotating) {
            this.mesh.rotation.y += this.rotationSpeed * this.rotationDirection;
        }

        // Update bounding box
        this.updateBoundingBox();

        // Check collision with map
        if (gameInstance.map.checkCollision(this.mesh.position, 1.5)) {
            this.mesh.position.copy(oldPosition);
            this.mesh.rotation.y = oldRotation;
            this.velocity.set(0, 0, 0);
            this.updateBoundingBox();
            return;
        }

        // Check collision with other tanks
        for (const otherTank of gameInstance.tanks) {
            if (otherTank !== this && !otherTank.isDead) {
                const distance = this.mesh.position.distanceTo(otherTank.mesh.position);
                if (distance < 3) {
                    this.mesh.position.copy(oldPosition);
                    this.mesh.rotation.y = oldRotation;
                    this.velocity.set(0, 0, 0);
                    this.updateBoundingBox();
                    return;
                }
            }
        }

        // Apply friction
        this.velocity.multiplyScalar(this.friction);
    }

    createNameLabel() {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        // Draw text with background
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = 'white';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.playerName, canvas.width/2, canvas.height/2);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            depthTest: false
        });
        
        // Create sprite
        this.nameLabel = new THREE.Sprite(material);
        this.nameLabel.scale.set(3, 0.75, 1);
        this.nameLabel.position.y = 2.5; // Position above tank
        this.mesh.add(this.nameLabel);
    }
}

// Update all players
function updatePlayers() {
    gameState.players.forEach(player => {
        // Update player animations, effects, etc.
    });
}

// Add new player
function addPlayer(playerData) {
    new Tank(
        playerData.position,
        playerData.team
    );
}

// Remove player
function removePlayer(playerId) {
    const player = gameState.players.get(playerId);
    if (player) {
        player.destroy();
    }
} 