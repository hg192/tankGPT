class GameMap {
    constructor(scene, mode) {
        if (!scene) {
            throw new Error('Scene is required for GameMap initialization');
        }
        this.scene = scene;
        this.mode = mode;
        this.walls = [];
        this.obstacles = [];
        this.bombSites = [];
        this.textures = {};
        this.init();
    }

    init() {
        // Create maps based on mode
        if (this.mode === 'bomb') {
            this.createBombModeMap();
        } else {
            this.createBattleModeMap();
        }
    }

    createBombModeMap() {
        // Create walls with pixel art texture
        const wallTexture = new THREE.TextureLoader().load(TextureGenerator.createWallTexture());
        wallTexture.magFilter = THREE.NearestFilter;
        wallTexture.minFilter = THREE.NearestFilter;
        const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });

        // Create outer walls
        this.createWall(-50, 0, 0, 1, 20, 100, wallMaterial); // Left
        this.createWall(50, 0, 0, 1, 20, 100, wallMaterial);  // Right
        this.createWall(0, 0, -50, 100, 20, 1, wallMaterial); // Front
        this.createWall(0, 0, 50, 100, 20, 1, wallMaterial);  // Back

        // Create bomb sites
        this.bombSites = [
            { position: new THREE.Vector3(-30, 0, -30), team: 'red' },
            { position: new THREE.Vector3(30, 0, 30), team: 'blue' }
        ];

        // Create obstacles
        this.createObstacle(-20, 0, -20, 5, 10, 5, wallMaterial);
        this.createObstacle(20, 0, 20, 5, 10, 5, wallMaterial);
        this.createObstacle(0, 0, 0, 5, 10, 5, wallMaterial);
    }

    createBattleModeMap() {
        // Create walls with apocalyptic texture
        const wallTexture = new THREE.TextureLoader().load(TextureGenerator.createApocalypseWallTexture());
        wallTexture.magFilter = THREE.NearestFilter;
        wallTexture.minFilter = THREE.NearestFilter;
        const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });

        // Create outer walls
        this.createWall(-50, 0, 0, 1, 20, 100, wallMaterial); // Left
        this.createWall(50, 0, 0, 1, 20, 100, wallMaterial);  // Right
        this.createWall(0, 0, -50, 100, 20, 1, wallMaterial); // Front
        this.createWall(0, 0, 50, 100, 20, 1, wallMaterial);  // Back

        // Create random obstacles
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 80 - 40;
            const z = Math.random() * 80 - 40;
            const width = Math.random() * 5 + 3;
            const height = Math.random() * 10 + 5;
            const depth = Math.random() * 5 + 3;

            const texture = Math.random() > 0.5 ? 
                TextureGenerator.createDebrisTexture() : 
                TextureGenerator.createApocalypseWallTexture();
            
            const material = new THREE.MeshStandardMaterial({ 
                map: new THREE.TextureLoader().load(texture),
                magFilter: THREE.NearestFilter,
                minFilter: THREE.NearestFilter
            });

            this.createObstacle(x, 0, z, width, height, depth, material);
        }

        // Create apocalyptic features
        this.createApocalypticFeatures();
    }

    createApocalypticFeatures() {
        // Create broken buildings
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 80 - 40;
            const z = Math.random() * 80 - 40;
            this.createBrokenBuilding(x, 0, z);
        }

        // Create craters
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 80 - 40;
            const z = Math.random() * 80 - 40;
            this.createCrater(x, 0, z);
        }
    }

    createBrokenBuilding(x, y, z) {
        const texture = new THREE.TextureLoader().load(TextureGenerator.createBrokenBuildingTexture());
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        const material = new THREE.MeshStandardMaterial({ map: texture });

        const width = Math.random() * 10 + 5;
        const height = Math.random() * 15 + 10;
        const depth = Math.random() * 10 + 5;

        const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            material
        );
        building.position.set(x, height / 2, z);
        this.scene.add(building);
    }

    createCrater(x, y, z) {
        const texture = new THREE.TextureLoader().load(TextureGenerator.createCraterTexture());
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        const material = new THREE.MeshStandardMaterial({ map: texture });

        const radius = Math.random() * 5 + 3;
        const segments = 32;
        const crater = new THREE.Mesh(
            new THREE.CircleGeometry(radius, segments),
            material
        );
        crater.rotation.x = -Math.PI / 2;
        crater.position.set(x, y + 0.1, z);
        this.scene.add(crater);
    }

    createWall(x, y, z, width, height, depth, material) {
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            material
        );
        wall.position.set(x, y + height / 2, z);
        this.scene.add(wall);
        this.walls.push(wall);
    }

    createObstacle(x, y, z, width, height, depth, material) {
        const obstacle = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            material
        );
        obstacle.position.set(x, y + height / 2, z);
        obstacle.geometry.computeBoundingBox();
        this.scene.add(obstacle);
        this.obstacles.push(obstacle);
    }

    checkCollision(position, radius) {
        // Check collision with walls
        for (const wall of this.walls) {
            const boundingBox = new THREE.Box3().setFromObject(wall);
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            
            const dx = Math.abs(position.x - center.x);
            const dz = Math.abs(position.z - center.z);
            
            const wallWidth = boundingBox.max.x - boundingBox.min.x;
            const wallDepth = boundingBox.max.z - boundingBox.min.z;
            
            if (dx < (wallWidth / 2 + radius) && dz < (wallDepth / 2 + radius)) {
                return true;
            }
        }
        
        // Check collision with obstacles
        for (const obstacle of this.obstacles) {
            const boundingBox = new THREE.Box3().setFromObject(obstacle);
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            
            const dx = Math.abs(position.x - center.x);
            const dz = Math.abs(position.z - center.z);
            
            const obstacleWidth = boundingBox.max.x - boundingBox.min.x;
            const obstacleDepth = boundingBox.max.z - boundingBox.min.z;
            
            if (dx < (obstacleWidth / 2 + radius) && dz < (obstacleDepth / 2 + radius)) {
                return true;
            }
        }
        
        return false;
    }

    clearMap() {
        // Remove all existing objects
        this.walls.forEach(wall => this.scene.remove(wall));
        this.obstacles.forEach(obstacle => this.scene.remove(obstacle));
        this.walls = [];
        this.obstacles = [];
        this.bombSites = [];
    }
} 