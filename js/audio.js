class AudioManager {
    constructor() {
        this.sounds = {
            tankMove: new Audio('assets/sounds/tank_move.mp3'),
            tankFire: new Audio('assets/sounds/tank_fire.mp3'),
            bulletHit: new Audio('assets/sounds/bullet_hit.mp3'),
            lowHealth: new Audio('assets/sounds/low_health.mp3'),
            bombTick: new Audio('assets/sounds/bomb_tick.mp3'),
            bombExplosion: new Audio('assets/sounds/bomb_explosion.mp3')
        };

        // Configure sounds
        this.sounds.tankMove.loop = true;
        this.sounds.tankMove.volume = 0.3;

        this.sounds.tankFire.volume = 0.5;

        this.sounds.bulletHit.volume = 0.4;

        this.sounds.lowHealth.volume = 0.3;

        this.sounds.bombTick.volume = 0.2;

        this.sounds.bombExplosion.volume = 0.7;

        // Bomb ticking state
        this.bombTickInterval = null;
        this.lastTickTime = 0;
        this.tickInterval = 1000; // Start with 1 second interval
    }

    playTankMove() {
        if (this.sounds.tankMove.paused) {
            this.sounds.tankMove.play();
        }
    }

    stopTankMove() {
        this.sounds.tankMove.pause();
        this.sounds.tankMove.currentTime = 0;
    }

    playTankFire() {
        this.sounds.tankFire.currentTime = 0;
        this.sounds.tankFire.play();
    }

    playBulletHit() {
        this.sounds.bulletHit.currentTime = 0;
        this.sounds.bulletHit.play();
    }

    playLowHealth() {
        this.sounds.lowHealth.currentTime = 0;
        this.sounds.lowHealth.play();
    }

    startBombTicking(timeLeft) {
        // Clear any existing interval
        if (this.bombTickInterval) {
            clearInterval(this.bombTickInterval);
        }

        // Calculate initial tick interval based on time left
        this.tickInterval = Math.max(100, 1000 - (30000 - timeLeft) / 30);
        this.lastTickTime = Date.now();

        // Start ticking
        this.bombTickInterval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastTick = now - this.lastTickTime;

            // Play tick sound
            this.sounds.bombTick.currentTime = 0;
            this.sounds.bombTick.play();

            // Update last tick time
            this.lastTickTime = now;

            // Decrease interval as time goes on
            this.tickInterval = Math.max(50, this.tickInterval - 10);
        }, this.tickInterval);
    }

    stopBombTicking() {
        if (this.bombTickInterval) {
            clearInterval(this.bombTickInterval);
            this.bombTickInterval = null;
        }
    }

    playBombExplosion() {
        this.stopBombTicking();
        this.sounds.bombExplosion.currentTime = 0;
        this.sounds.bombExplosion.play();
    }
} 