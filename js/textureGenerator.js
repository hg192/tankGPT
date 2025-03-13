class TextureGenerator {
    static createPixelArtTexture(width, height, colors) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Set background
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);

        // Draw pixel pattern
        for (let y = 0; y < height; y += 2) {
            for (let x = 0; x < width; x += 2) {
                if ((x + y) % 4 === 0) {
                    ctx.fillStyle = colors.pattern;
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }

        return canvas.toDataURL('image/png');
    }

    static createGroundTexture() {
        return this.createPixelArtTexture(64, 64, {
            background: '#2a2a2a',
            pattern: '#333333'
        });
    }

    static createWallTexture() {
        return this.createPixelArtTexture(32, 32, {
            background: '#666666',
            pattern: '#777777'
        });
    }

    static createTankTexture(team) {
        return this.createPixelArtTexture(32, 32, {
            background: team === 'red' ? '#ff0000' : '#0000ff',
            pattern: team === 'red' ? '#cc0000' : '#0000cc'
        });
    }

    static createApocalypseWallTexture() {
        return this.createPixelArtTexture(32, 32, {
            background: '#4a4a4a',
            pattern: '#555555'
        });
    }

    static createDebrisTexture() {
        return this.createPixelArtTexture(32, 32, {
            background: '#3a3a3a',
            pattern: '#444444'
        });
    }

    static createBrokenBuildingTexture() {
        return this.createPixelArtTexture(32, 32, {
            background: '#5a5a5a',
            pattern: '#666666'
        });
    }

    static createCraterTexture() {
        return this.createPixelArtTexture(32, 32, {
            background: '#2a2a2a',
            pattern: '#333333'
        });
    }
}
