class BotBehavior {
    constructor(tank, team) {
        this.tank = tank;
        this.team = team;
        this.state = 'patrol';
        this.targetPosition = null;
        this.lastStateChange = Date.now();
        this.lastShot = Date.now();
        this.shotCooldown = 1000; // 1 second cooldown between shots
        this.detectionRange = 20; // Range to detect enemies
        this.stateChangeCooldown = 3000; // Time before changing patrol pattern
        
        // Different movement patterns based on team
        this.patterns = this.team === 'red' ? [
            'attack',
            'plant_bomb',
            'support'
        ] : [
            'defend',
            'patrol',
            'retreat'
        ];
        
        this.currentPattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
        this.attackMode = this.team === 'red'; // Red team starts in attack mode
        
        // Pattern-specific variables
        this.circleCenter = null;
        this.circleRadius = 10;
        this.circleAngle = 0;
        this.zigzagPoints = [];
        this.zigzagIndex = 0;
        this.lastPatternChange = Date.now();
        this.patternChangeInterval = 5000; // Change pattern every 5 seconds

        // Force initial pattern setup
        this.changePattern();
    }

    update() {
        if (!gameInstance.gameActive || this.tank.isDead) return;

        // Check for enemies and shoot if detected
        this.checkAndShootEnemies();

        // Change pattern periodically
        if (Date.now() - this.lastPatternChange > this.patternChangeInterval) {
            this.changePattern();
        }

        // Execute current movement pattern
        this.executePattern();
    }

    executePattern() {
        switch (this.currentPattern) {
            case 'attack':
                this.attackPattern();
                break;
            case 'plant_bomb':
                this.plantBombPattern();
                break;
            case 'support':
                this.supportPattern();
                break;
            case 'defend':
                this.defendPattern();
                break;
            case 'patrol':
                this.patrolPattern();
                break;
            case 'retreat':
                this.retreatPattern();
                break;
        }
    }

    changePattern() {
        // If tank has bomb, prioritize planting pattern
        if (this.tank.hasBomb) {
            this.currentPattern = 'plant_bomb';
        } else if (this.team === 'red') {
            // Red team focuses on attack patterns
            this.currentPattern = Math.random() < 0.7 ? 'attack' : 'support';
        } else {
            // Blue team focuses on defense patterns
            this.currentPattern = Math.random() < 0.7 ? 'defend' : 'patrol';
        }
        
        this.lastPatternChange = Date.now();

        // Reset pattern-specific variables
        switch (this.currentPattern) {
            case 'attack':
                this.targetPosition = this.getInitialPosition();
                break;
            case 'plant_bomb':
                this.targetPosition = this.getInitialPosition();
                break;
            case 'support':
                this.targetPosition = this.getSupportPosition();
                break;
            case 'defend':
                this.targetPosition = this.getDefensivePosition();
                break;
            case 'patrol':
                this.targetPosition = this.getPatrolPosition();
                break;
            case 'retreat':
                this.targetPosition = this.getRetreatPosition();
                break;
        }
    }

    getInitialPosition() {
        // Return a position near the tank's current position
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 5;
        return new THREE.Vector3(
            this.tank.mesh.position.x + Math.cos(angle) * radius,
            1,
            this.tank.mesh.position.z + Math.sin(angle) * radius
        );
    }

    attackPattern() {
        const bombSite = gameInstance.teams.blue.bombSite;
        if (!bombSite) {
            // If bomb site not initialized, move randomly
            if (!this.targetPosition || this.tank.mesh.position.distanceTo(this.targetPosition) < 2) {
                this.targetPosition = this.getInitialPosition();
            }
            this.moveTowards(this.targetPosition);
            return;
        }

        const distance = this.tank.mesh.position.distanceTo(bombSite);

        // Red team bots will be more aggressive in moving towards bomb site
        if (this.team === 'red') {
            if (distance < 5) {
                // If close to bomb site, try to plant bomb
                if (gameInstance.bomb && !gameInstance.bomb.isPlanted) {
                    if (!gameInstance.bomb.plantStartTime) {
                        gameInstance.bomb.startPlanting(this.tank);
                    } else {
                        gameInstance.bomb.continuePlanting();
                    }
                }
            } else {
                // Move directly towards bomb site
                this.moveTowards(bombSite);
                
                // Occasionally dodge while moving
                if (Math.random() < 0.1) {
                    const dodgeAngle = Math.random() < 0.5 ? Math.PI/2 : -Math.PI/2;
                    const dodgeVector = new THREE.Vector3(
                        Math.sin(this.tank.mesh.rotation.y + dodgeAngle),
                        0,
                        Math.cos(this.tank.mesh.rotation.y + dodgeAngle)
                    );
                    this.targetPosition = this.tank.mesh.position.clone().add(dodgeVector.multiplyScalar(3));
                }
            }
        } else {
            // Blue team behavior remains the same
            if (distance < 5) {
                if (gameInstance.bomb && !gameInstance.bomb.isPlanted) {
                    if (!gameInstance.bomb.plantStartTime) {
                        gameInstance.bomb.startPlanting(this.tank);
                    } else {
                        gameInstance.bomb.continuePlanting();
                    }
                }
            } else {
                this.moveTowards(bombSite);
            }
        }
    }

    plantBombPattern() {
        if (!this.tank.hasBomb) {
            this.changePattern();
            return;
        }

        const bombSite = gameInstance.teams.blue.bombSite;
        if (!bombSite) {
            // If bomb site not initialized, move randomly
            if (!this.targetPosition || this.tank.mesh.position.distanceTo(this.targetPosition) < 2) {
                this.targetPosition = this.getInitialPosition();
            }
            this.moveTowards(this.targetPosition);
            return;
        }

        const distance = this.tank.mesh.position.distanceTo(bombSite);

        if (distance < 5) {
            // Try to plant the bomb
            if (gameInstance.bomb && !gameInstance.bomb.isPlanted) {
                if (!gameInstance.bomb.plantStartTime) {
                    gameInstance.bomb.startPlanting(this.tank);
                } else {
                    gameInstance.bomb.continuePlanting();
                }
            }
        } else {
            // Move towards bomb site
            this.moveTowards(bombSite);
        }
    }

    supportPattern() {
        // Find nearest teammate with bomb
        const bombCarrier = this.findNearestTeammateWithBomb();
        if (bombCarrier) {
            const distance = this.tank.mesh.position.distanceTo(bombCarrier.mesh.position);
            if (distance > 5) {
                // Move towards bomb carrier
                this.moveTowards(bombCarrier.mesh.position);
            }
        } else {
            // If no bomb carrier found, switch to attack pattern
            this.currentPattern = 'attack';
            this.targetPosition = this.getInitialPosition();
            this.moveTowards(this.targetPosition);
        }
    }

    defendPattern() {
        const bombSite = gameInstance.teams.blue.bombSite;
        if (!bombSite) {
            // If bomb site not initialized, move randomly
            if (!this.targetPosition || this.tank.mesh.position.distanceTo(this.targetPosition) < 2) {
                this.targetPosition = this.getInitialPosition();
            }
            this.moveTowards(this.targetPosition);
            return;
        }

        const distance = this.tank.mesh.position.distanceTo(bombSite);

        if (distance > 10) {
            // Move towards bomb site if too far
            this.moveTowards(bombSite);
        } else {
            // Patrol around bomb site
            if (!this.targetPosition || this.tank.mesh.position.distanceTo(this.targetPosition) < 2) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 5 + Math.random() * 5;
                this.targetPosition = new THREE.Vector3(
                    bombSite.x + Math.cos(angle) * radius,
                    1,
                    bombSite.z + Math.sin(angle) * radius
                );
            }
            this.moveTowards(this.targetPosition);
        }
    }

    patrolPattern() {
        const bombSite = gameInstance.teams.blue.bombSite;
        if (!bombSite) {
            // If bomb site not initialized, move randomly
            if (!this.targetPosition || this.tank.mesh.position.distanceTo(this.targetPosition) < 2) {
                this.targetPosition = this.getInitialPosition();
            }
            this.moveTowards(this.targetPosition);
            return;
        }

        if (!this.targetPosition || this.tank.mesh.position.distanceTo(this.targetPosition) < 2) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 10;
            this.targetPosition = new THREE.Vector3(
                bombSite.x + Math.cos(angle) * radius,
                1,
                bombSite.z + Math.sin(angle) * radius
            );
        }
        this.moveTowards(this.targetPosition);
    }

    retreatPattern() {
        const bombSite = gameInstance.teams.blue.bombSite;
        if (!bombSite) {
            // If bomb site not initialized, move randomly
            if (!this.targetPosition || this.tank.mesh.position.distanceTo(this.targetPosition) < 2) {
                this.targetPosition = this.getInitialPosition();
            }
            this.moveTowards(this.targetPosition);
            return;
        }

        const distance = this.tank.mesh.position.distanceTo(bombSite);

        if (distance < 15) {
            // Move away from bomb site
            const awayVector = this.tank.mesh.position.clone().sub(bombSite).normalize();
            const targetPos = this.tank.mesh.position.clone().add(awayVector.multiplyScalar(10));
            this.moveTowards(targetPos);
        } else {
            // Switch back to defend pattern
            this.currentPattern = 'defend';
            this.targetPosition = this.getDefensivePosition();
            this.moveTowards(this.targetPosition);
        }
    }

    getDefensivePosition() {
        const bombSite = gameInstance.teams.blue.bombSite;
        if (!bombSite) {
            return this.getInitialPosition();
        }

        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 5;
        return new THREE.Vector3(
            bombSite.x + Math.cos(angle) * radius,
            1,
            bombSite.z + Math.sin(angle) * radius
        );
    }

    getPatrolPosition() {
        if (!gameInstance || !gameInstance.teams || !gameInstance.teams[this.team]) {
            return this.getInitialPosition();
        }

        const teamArea = this.team === 'red' ? {
            x: -35,
            z: -35,
            width: 20,
            depth: 20
        } : {
            x: 35,
            z: 35,
            width: 20,
            depth: 20
        };

        const randomX = teamArea.x + (Math.random() - 0.5) * teamArea.width;
        const randomZ = teamArea.z + (Math.random() - 0.5) * teamArea.depth;
        return new THREE.Vector3(randomX, 1, randomZ);
    }

    getRetreatPosition() {
        const bombSite = gameInstance.teams.blue.bombSite;
        if (!bombSite) {
            return this.getInitialPosition();
        }

        const awayVector = this.tank.mesh.position.clone().sub(bombSite).normalize();
        return this.tank.mesh.position.clone().add(awayVector.multiplyScalar(10));
    }

    getSupportPosition() {
        const bombCarrier = this.findNearestTeammateWithBomb();
        if (bombCarrier) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 5;
            return new THREE.Vector3(
                bombCarrier.mesh.position.x + Math.cos(angle) * radius,
                1,
                bombCarrier.mesh.position.z + Math.sin(angle) * radius
            );
        }
        return this.getPatrolPosition();
    }

    findNearestTeammateWithBomb() {
        let nearestTeammate = null;
        let nearestDistance = Infinity;

        for (const tank of gameInstance.tanks) {
            if (tank.team === this.team && tank.hasBomb && !tank.isDead) {
                const distance = this.tank.mesh.position.distanceTo(tank.mesh.position);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestTeammate = tank;
                }
            }
        }

        return nearestTeammate;
    }

    moveTowards(targetPosition) {
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.tank.mesh.position)
            .normalize();

        // Calculate angle to target
        const targetAngle = Math.atan2(direction.x, direction.z);
        const currentAngle = this.tank.mesh.rotation.y;
        let angleDiff = targetAngle - currentAngle;

        // Normalize angle difference to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Rotate towards target
        if (angleDiff > 0.1) {
            this.tank.move('right');
        } else if (angleDiff < -0.1) {
            this.tank.move('left');
        }

        // Move forward if facing roughly the right direction
        if (Math.abs(angleDiff) < Math.PI / 3) {
            this.tank.move('forward');
        }
    }

    checkAndShootEnemies() {
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
            const distance = this.tank.mesh.position.distanceTo(nearestEnemy.mesh.position);
            if (distance < this.detectionRange) {
                // Check if enough time has passed since last shot
                if (Date.now() - this.lastShot > this.shotCooldown) {
                    // Calculate angle to enemy
                    const direction = new THREE.Vector3()
                        .subVectors(nearestEnemy.mesh.position, this.tank.mesh.position)
                        .normalize();
                    const targetAngle = Math.atan2(direction.x, direction.z);
                    const currentAngle = this.tank.mesh.rotation.y;
                    let angleDiff = Math.abs(targetAngle - currentAngle);
                    
                    // Normalize angle difference
                    while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
                    
                    // Only shoot if facing roughly towards enemy
                    if (angleDiff < Math.PI / 6) {
                        this.tank.fire();
                        this.lastShot = Date.now();
                    }
                }
            }
        }
    }

    findNearestEnemy() {
        let nearestEnemy = null;
        let nearestDistance = Infinity;

        for (const tank of gameInstance.tanks) {
            if (tank.team !== this.team && !tank.isDead) {
                const distance = this.tank.mesh.position.distanceTo(tank.mesh.position);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = tank;
                }
            }
        }

        return nearestEnemy;
    }
}