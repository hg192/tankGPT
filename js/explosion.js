class Explosion {
    constructor(id, position) {
        this.id = id;
        this.duration = 1000; // milliseconds
        this.startTime = Date.now();
        this.maxSize = 2;
        
        // Create explosion mesh
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff3300,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        
        // Add to scene
        gameState.scene.add(this.mesh);
        gameState.explosions.set(id, this);
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        
        if (progress >= 1) {
            this.destroy();
            return;
        }
        
        // Update size and opacity
        const size = this.maxSize * (1 - progress);
        this.mesh.scale.set(size, size, size);
        this.mesh.material.opacity = 1 - progress;
    }
    
    destroy() {
        gameState.scene.remove(this.mesh);
        gameState.explosions.delete(this.id);
    }
}

// Update all explosions
function updateExplosions() {
    gameState.explosions.forEach(explosion => {
        explosion.update();
    });
}

// Create new explosion
function createExplosion(position) {
    const id = Date.now().toString();
    new Explosion(id, position);
} 