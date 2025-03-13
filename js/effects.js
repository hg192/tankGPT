class Effects {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    createExplosion(position) {
        const particleCount = 50;
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff5500,
            transparent: true
        });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            // Random velocity
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            
            particle.lifetime = 1; // 1 second lifetime
            particle.startTime = Date.now();
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    createSmoke(position) {
        const particleCount = 20;
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.5
        });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            // Smoke rises and spreads
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                Math.random() * 1,
                (Math.random() - 0.5) * 0.5
            );
            
            particle.lifetime = 2; // 2 seconds lifetime
            particle.startTime = Date.now();
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    createHitSpark(position) {
        const particleCount = 10;
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true
        });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            // Sparks fly outward
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 3,
                (Math.random() - 0.5) * 3
            );
            
            particle.lifetime = 0.5; // 0.5 seconds lifetime
            particle.startTime = Date.now();
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    update() {
        const now = Date.now();
        
        // Update and remove dead particles
        this.particles = this.particles.filter(particle => {
            const age = (now - particle.startTime) / 1000; // age in seconds
            
            if (age > particle.lifetime) {
                this.scene.remove(particle);
                return false;
            }
            
            // Update position
            particle.position.add(particle.velocity);
            
            // Fade out
            if (particle.material.opacity) {
                particle.material.opacity = 1 - (age / particle.lifetime);
            }
            
            // Slow down
            particle.velocity.multiplyScalar(0.95);
            
            return true;
        });
    }
} 