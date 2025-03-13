class BotBehavior {
    constructor(tank, team) {
        this.tank = tank;
        this.team = team;
        this.gameInstance = null;
        this.isFollower = false;
        this.followTarget = null;
        this.followDistance = 5;
        this.lastActionTime = 0;
        this.actionDelay = 500; // Reduced from 1000 to 500 for smoother movement
        this.currentTarget = null;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderRadius = 30; // Increased from 20 to 30
        this.wanderDistance = 15; // Increased from 10 to 15
        this.wanderJitter = 0.2; // Reduced from 0.5 to 0.2 for more stable movement
        this.rotationSpeed = 0.05; // Added rotation speed control
        this.minWanderTime = 2000; // Minimum time to wander in one direction
        this.lastWanderChange = Date.now();
    }

    update() {
        const currentTime = Date.now();
        if (currentTime - this.lastActionTime < this.actionDelay) return;
        this.lastActionTime = currentTime;

        if (this.isFollower && this.followTarget) {
            this.followPlayer();
            return;
        }

        // ... existing code ...
    }

    followPlayer() {
        if (!this.followTarget || this.followTarget.isDead) return;

        const currentPos = this.tank.mesh.position;
        
        // Find nearest enemy
        const enemies = this.gameInstance.tanks.filter(t => 
            t.team !== this.team && !t.isDead
        );

        let nearestEnemy = null;
        let minDistance = Infinity;

        for (const enemy of enemies) {
            const distance = currentPos.distanceTo(enemy.mesh.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        }

        // If enemy is nearby, attack
        if (nearestEnemy && minDistance < 50) {
            this.currentTarget = nearestEnemy;
            this.attackTarget();
            return;
        }

        // If no enemy nearby, wander around
        this.wander();
    }

    attackTarget() {
        if (!this.currentTarget) return;

        const targetPos = this.currentTarget.mesh.position;
        const currentPos = this.tank.mesh.position;
        const direction = new THREE.Vector3();
        direction.subVectors(targetPos, currentPos);
        direction.y = 0;
        direction.normalize();

        // Calculate angle to target
        const angle = Math.atan2(direction.x, direction.z);
        const currentAngle = this.tank.mesh.rotation.y;
        let angleDiff = angle - currentAngle;

        // Normalize angle difference
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Rotate towards target with controlled speed
        if (Math.abs(angleDiff) > 0.1) {
            this.tank.mesh.rotation.y += Math.sign(angleDiff) * this.rotationSpeed;
        }

        // Move towards target
        this.tank.move('forward');

        // Fire at target when roughly facing it
        if (Math.abs(angleDiff) < 0.3) {
            this.tank.fire();
        }
    }

    wander() {
        const currentTime = Date.now();
        
        // Change wander direction after minimum time
        if (currentTime - this.lastWanderChange > this.minWanderTime) {
            this.wanderAngle += (Math.random() - 0.5) * this.wanderJitter;
            this.lastWanderChange = currentTime;
        }
        
        // Calculate target position
        const targetX = this.tank.mesh.position.x + Math.cos(this.wanderAngle) * this.wanderDistance;
        const targetZ = this.tank.mesh.position.z + Math.sin(this.wanderAngle) * this.wanderDistance;
        const targetPos = new THREE.Vector3(targetX, 0, targetZ);

        // Calculate direction to wander target
        const direction = new THREE.Vector3();
        direction.subVectors(targetPos, this.tank.mesh.position);
        direction.y = 0;
        direction.normalize();

        // Calculate angle to wander target
        const angle = Math.atan2(direction.x, direction.z);
        const currentAngle = this.tank.mesh.rotation.y;
        let angleDiff = angle - currentAngle;

        // Normalize angle difference
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Rotate towards wander target with controlled speed
        if (Math.abs(angleDiff) > 0.1) {
            this.tank.mesh.rotation.y += Math.sign(angleDiff) * this.rotationSpeed;
        }

        // Move forward
        this.tank.move('forward');
    }

    // ... existing code ...
} 