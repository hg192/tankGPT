class Bomb {
    constructor() {
        this.carrier = null;
        this.isPlanted = false;
        this.plantTime = 3000; // 3 seconds to plant
        this.defuseTime = 5000; // 5 seconds to defuse
        this.explosionTime = 30000; // 30 seconds until explosion
        this.plantStartTime = null;
        this.defuseStartTime = null;
        this.plantedTime = null;
        this.mesh = this.createMesh();
        this.floatHeight = 2; // Height above tank
        this.floatOffset = 0; // For bobbing animation
        this.floatSpeed = 0.05; // Speed of bobbing animation
        this.blinkInterval = null;
    }

    createMesh() {
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        return mesh;
    }

    assignToRandomRedPlayer() {
        const redTeam = window.gameInstance.teams.red.players;
        if (redTeam.length > 0) {
            const randomIndex = Math.floor(Math.random() * redTeam.length);
            this.carrier = redTeam[randomIndex];
            // Attach bomb to carrier
            this.carrier.hasBomb = true;
            this.mesh.position.copy(this.carrier.mesh.position);
            this.mesh.position.y = 1;
            window.gameInstance.scene.add(this.mesh);
        }
    }

    update() {
        if (!this.isPlanted && this.carrier) {
            // Update bomb position to float above carrier
            this.mesh.position.copy(this.carrier.mesh.position);
            
            // Add bobbing animation
            this.floatOffset += this.floatSpeed;
            const bobHeight = Math.sin(this.floatOffset) * 0.2;
            this.mesh.position.y = this.floatHeight + bobHeight;
            
            // Rotate the bomb
            this.mesh.rotation.y += 0.02;
        }

        if (this.isPlanted) {
            const now = Date.now();
            if (now - this.plantedTime >= this.explosionTime) {
                this.explode();
            }
        }
    }

    startPlanting(planter) {
        if (planter.team === 'red' && this.carrier === planter) {
            const blueSite = window.gameInstance.teams.blue.bombSite;
            const distance = planter.mesh.position.distanceTo(blueSite);
            if (distance < 5) { // Within bomb site radius
                this.plantStartTime = Date.now();
                window.gameInstance.showBombAction('Planting Bomb...', 0);
                return true;
            }
        }
        return false;
    }

    continuePlanting() {
        if (this.plantStartTime) {
            const now = Date.now();
            const progress = (now - this.plantStartTime) / this.plantTime;
            window.gameInstance.showBombAction('Planting Bomb...', progress);
            
            if (progress >= 1) {
                this.plant();
                window.gameInstance.hideBombAction();
                return true;
            }
            return progress;
        }
        return false;
    }

    plant() {
        this.isPlanted = true;
        this.plantedTime = Date.now();
        this.carrier.hasBomb = false;
        this.carrier = null;
        // Make bomb mesh larger and yellow when planted
        this.mesh.scale.set(2, 2, 2);
        this.mesh.material.color.setHex(0xffff00);
        this.mesh.material.emissive.setHex(0xffff00);
        // Add blinking effect
        this.startBlinking();
    }

    startBlinking() {
        // Clear any existing interval
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
        }
        
        // Start new blinking effect
        this.blinkInterval = setInterval(() => {
            if (!this.isPlanted) {
                clearInterval(this.blinkInterval);
                return;
            }
            const currentColor = this.mesh.material.color.getHex();
            const newColor = currentColor === 0xffff00 ? 0x000000 : 0xffff00;
            this.mesh.material.color.setHex(newColor);
            this.mesh.material.emissive.setHex(newColor);
        }, 500);
    }

    startDefusing(defuser) {
        if (defuser.team === 'blue' && this.isPlanted) {
            const distance = defuser.mesh.position.distanceTo(this.mesh.position);
            if (distance < 3) { // Within defuse radius
                this.defuseStartTime = Date.now();
                window.gameInstance.showBombAction('Defusing Bomb...', 0);
                return true;
            }
        }
        return false;
    }

    continueDefusing() {
        if (this.defuseStartTime) {
            const now = Date.now();
            const progress = (now - this.defuseStartTime) / this.defuseTime;
            window.gameInstance.showBombAction('Defusing Bomb...', progress);
            
            if (progress >= 1) {
                this.defuse();
                window.gameInstance.hideBombAction();
                return true;
            }
            return progress;
        }
        return false;
    }

    defuse() {
        this.isPlanted = false;
        window.gameInstance.scene.remove(this.mesh);
        // Blue team wins
        window.gameInstance.endRound('blue');
    }

    explode() {
        if (this.isPlanted) {
            // Create explosion effect
            window.gameInstance.effects.createExplosion(this.mesh.position.clone(), 5);
            // Damage nearby tanks
            for (const tank of window.gameInstance.tanks) {
                const distance = tank.mesh.position.distanceTo(this.mesh.position);
                if (distance < 10) { // Explosion radius
                    const damage = Math.floor(100 * (1 - distance / 10)); // More damage closer to explosion
                    window.gameInstance.handleTankHit(tank, damage);
                }
            }
            // Red team wins
            window.gameInstance.endRound('red');
            // Remove bomb
            window.gameInstance.scene.remove(this.mesh);
        }
    }

    cancelAction() {
        this.plantStartTime = null;
        this.defuseStartTime = null;
        window.gameInstance.hideBombAction();
    }
} 