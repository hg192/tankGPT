class Bullet {
    constructor(tank, team) {
        this.tank = tank;
        this.team = team;
        this.speed = 0.5;
        this.damage = 20;
        this.mesh = this.createMesh();
        this.mesh.position.copy(tank.mesh.position);
        this.mesh.rotation.copy(tank.mesh.rotation);
        
        // Calculate bullet direction based on tank's rotation
        this.direction = new THREE.Vector3(0, 0, 1); // Start with forward direction
        this.direction.applyQuaternion(tank.mesh.quaternion);
        
        // Offset bullet position slightly forward from tank
        this.mesh.position.x += this.direction.x * 2;
        this.mesh.position.z += this.direction.z * 2;
        this.mesh.position.y += 1; // Raise bullet slightly above ground
        
        this.isDestroyed = false;
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(0.3, 8, 8); // Increased from 0.1 to 0.3
        const material = new THREE.MeshPhongMaterial({
            color: this.team === 'red' ? 0xff0000 : 0x0000ff,
            emissive: this.team === 'red' ? 0xff0000 : 0x0000ff,
            emissiveIntensity: 0.5
        });
        return new THREE.Mesh(geometry, material);
    }

    update() {
        if (this.isDestroyed) return;

        // Move bullet in the calculated direction
        this.mesh.position.x += this.direction.x * this.speed;
        this.mesh.position.z += this.direction.z * this.speed;

        // Check for collisions
        this.checkCollisions();

        // Check if bullet is out of bounds
        if (Math.abs(this.mesh.position.x) > 50 || Math.abs(this.mesh.position.z) > 50) {
            this.destroy();
        }
    }

    checkCollisions() {
        // Check collision with tanks
        for (const tank of gameInstance.tanks) {
            if (tank.team !== this.team && !tank.isDead) {
                const distance = this.mesh.position.distanceTo(tank.mesh.position);
                if (distance < 1.5) {
                    tank.takeDamage(this.damage);
                    this.destroy();
                    return;
                }
            }
        }

        // Check collision with walls and obstacles
        if (gameInstance.map.checkCollision(this.mesh.position, 0.1)) {
            gameInstance.effects.createHitSpark(this.mesh.position.clone());
            this.destroy();
        }
    }

    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        gameInstance.scene.remove(this.mesh);
        
        const index = gameInstance.bullets.indexOf(this);
        if (index > -1) {
            gameInstance.bullets.splice(index, 1);
        }
    }
}

// Update all bullets
function updateBullets() {
    gameInstance.bullets.forEach(bullet => {
        bullet.update();
    });
}

// Add new bullet
function addBullet(bulletData) {
    const bullet = new Bullet(
        bulletData.tank,
        bulletData.team
    );
    gameInstance.bullets.push(bullet);
    gameInstance.scene.add(bullet.mesh);
} 