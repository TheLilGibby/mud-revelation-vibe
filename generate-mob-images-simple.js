/**
 * Pure Node.js Mob Image Generator - NO DEPENDENCIES REQUIRED
 * Creates simple PNG images using only built-in Node.js modules
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

// PNG Helper Functions
function createPNG(width, height, pixelData) {
    // PNG file signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // IHDR chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr.writeUInt8(8, 8);  // bit depth
    ihdr.writeUInt8(6, 9);  // color type (RGBA)
    ihdr.writeUInt8(0, 10); // compression
    ihdr.writeUInt8(0, 11); // filter
    ihdr.writeUInt8(0, 12); // interlace
    
    const ihdrChunk = createChunk('IHDR', ihdr);
    
    // IDAT chunk (image data)
    const imageData = Buffer.alloc(height * (1 + width * 4));
    let offset = 0;
    
    for (let y = 0; y < height; y++) {
        imageData[offset++] = 0; // filter type: none
        for (let x = 0; x < width; x++) {
            const pixel = pixelData(x, y);
            imageData[offset++] = pixel.r;
            imageData[offset++] = pixel.g;
            imageData[offset++] = pixel.b;
            imageData[offset++] = pixel.a;
        }
    }
    
    const compressedData = zlib.deflateSync(imageData, { level: 9 });
    const idatChunk = createChunk('IDAT', compressedData);
    
    // IEND chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));
    
    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    
    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    const crcValue = calculateCRC(crcData);
    crc.writeUInt32BE(crcValue >>> 0, 0); // >>> 0 converts to unsigned
    
    return Buffer.concat([length, typeBuffer, data, crc]);
}

function calculateCRC(buffer) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buffer.length; i++) {
        crc = crcTable[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0; // Ensure unsigned 32-bit
}

// CRC table
const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
    }
    return table;
})();

// Mob color logic
function getMobColor(mob) {
    if (mob.IsBoss) {
        return { r: 180, g: 20, b: 60 }; // Crimson
    }
    
    const level = mob.Level || 1;
    if (level >= 100) return { r: 138, g: 43, b: 226 }; // Purple
    if (level >= 75) return { r: 255, g: 69, b: 0 };    // Red-Orange
    if (level >= 50) return { r: 255, g: 140, b: 0 };   // Dark Orange
    if (level >= 25) return { r: 255, g: 215, b: 0 };   // Gold
    if (level >= 10) return { r: 50, g: 205, b: 50 };   // Lime Green
    return { r: 100, g: 149, b: 237 };                  // Cornflower Blue
}

function adjustColor(color, amount) {
    return {
        r: Math.max(0, Math.min(255, color.r + amount)),
        g: Math.max(0, Math.min(255, color.g + amount)),
        b: Math.max(0, Math.min(255, color.b + amount)),
        a: 255
    };
}

// Generate pixel art for a mob
function generateMobPixelArt(mob) {
    const size = 32;
    const baseColor = getMobColor(mob);
    const highlight = adjustColor(baseColor, 40);
    const shadow = adjustColor(baseColor, -40);
    const transparent = { r: 0, g: 0, b: 0, a: 0 };
    
    baseColor.a = 255;
    
    // Hash mob name for variant
    const hash = crypto.createHash('md5').update(mob.Name).digest('hex');
    const variant = parseInt(hash.substring(0, 8), 16) % 5;
    const isBoss = mob.IsBoss || false;
    
    // Create pixel grid
    const pixels = {};
    const setPixel = (x, y, color) => {
        if (x >= 0 && x < size && y >= 0 && y < size) {
            pixels[`${x},${y}`] = color;
        }
    };
    
    const fillRect = (x, y, w, h, color) => {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                setPixel(x + dx, y + dy, color);
            }
        }
    };
    
    const fillCircle = (cx, cy, r, color) => {
        for (let y = -r; y <= r; y++) {
            for (let x = -r; x <= r; x++) {
                if (x * x + y * y <= r * r) {
                    setPixel(cx + x, cy + y, color);
                }
            }
        }
    };
    
    // Draw based on variant
    if (isBoss) {
        // Boss
        fillRect(10, 14, 12, 14, baseColor);
        fillCircle(16, 13, 5, baseColor);
        fillRect(13, 11, 1, 1, { r: 255, g: 0, b: 0, a: 255 });
        fillRect(18, 11, 1, 1, { r: 255, g: 0, b: 0, a: 255 });
        fillRect(8, 16, 2, 8, shadow);
        fillRect(22, 16, 2, 8, shadow);
        fillRect(12, 6, 1, 2, { r: 255, g: 215, b: 0, a: 255 });
        fillRect(19, 6, 1, 2, { r: 255, g: 215, b: 0, a: 255 });
        fillRect(9, 13, 1, 16, highlight);
        fillRect(22, 13, 1, 16, highlight);
    } else if (variant === 0) {
        // Humanoid
        fillRect(12, 16, 8, 10, baseColor);
        fillCircle(16, 13, 3, highlight);
        fillRect(14, 12, 1, 1, { r: 0, g: 0, b: 0, a: 255 });
        fillRect(17, 12, 1, 1, { r: 0, g: 0, b: 0, a: 255 });
        fillRect(10, 18, 2, 6, shadow);
        fillRect(20, 18, 2, 6, shadow);
        fillRect(13, 26, 2, 4, shadow);
        fillRect(17, 26, 2, 4, shadow);
    } else if (variant === 1) {
        // Beast
        fillCircle(16, 19, 6, baseColor);
        fillCircle(22, 14, 4, highlight);
        fillRect(20, 8, 1, 2, baseColor);
        fillRect(23, 8, 1, 2, baseColor);
        fillRect(11, 24, 2, 4, shadow);
        fillRect(14, 24, 2, 4, shadow);
        fillRect(17, 24, 2, 4, shadow);
        fillRect(20, 24, 2, 4, shadow);
    } else if (variant === 2) {
        // Flying
        fillCircle(16, 19, 2, baseColor);
        fillCircle(16, 14, 2, highlight);
        fillRect(10, 16, 4, 6, shadow);
        fillRect(18, 16, 4, 6, shadow);
        fillRect(15, 14, 1, 1, { r: 255, g: 255, b: 0, a: 255 });
        fillRect(17, 14, 1, 1, { r: 255, g: 255, b: 0, a: 255 });
    } else if (variant === 3) {
        // Blob
        fillCircle(16, 21, 6, baseColor);
        fillCircle(15, 18, 2, highlight);
        fillCircle(13, 20, 1, { r: 0, g: 0, b: 0, a: 255 });
        fillCircle(19, 20, 1, { r: 0, g: 0, b: 0, a: 255 });
    } else {
        // Undead
        fillCircle(16, 14, 4, { r: 240, g: 240, b: 240, a: 255 });
        fillCircle(14, 13, 1, { r: 0, g: 0, b: 0, a: 255 });
        fillCircle(18, 13, 1, { r: 0, g: 0, b: 0, a: 255 });
        fillRect(14, 13, 1, 1, baseColor);
        fillRect(18, 13, 1, 1, baseColor);
        fillRect(14, 18, 4, 10, { r: 200, g: 200, b: 200, a: 255 });
        for (let i = 20; i < 26; i += 2) {
            fillRect(13, i, 6, 1, { r: 180, g: 180, b: 180, a: 255 });
        }
    }
    
    // Generate PNG
    return createPNG(size, size, (x, y) => {
        return pixels[`${x},${y}`] || transparent;
    });
}

// Main
async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('  GENERATING MOB PIXEL ART (Pure Node.js - No Dependencies!)');
    console.log('='.repeat(70) + '\n');
    
    console.log('Loading mobs data...');
    const mobsData = fs.readFileSync('GameData/Mobs.json', 'utf8');
    const mobs = JSON.parse(mobsData);
    
    console.log(`Found ${mobs.length} mobs\n`);
    
    const outputDir = path.join('public', 'images', 'mobs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    console.log(`Output directory: ${outputDir}\n`);
    
    console.log('Generating pixel art...');
    for (let i = 0; i < mobs.length; i++) {
        const mob = mobs[i];
        const pngBuffer = generateMobPixelArt(mob);
        const filepath = path.join(outputDir, `${mob.Id}.png`);
        fs.writeFileSync(filepath, pngBuffer);
        
        if ((i + 1) % 100 === 0) {
            console.log(`  ${i + 1}/${mobs.length} images generated...`);
        }
    }
    
    const bossCount = mobs.filter(m => m.IsBoss).length;
    
    console.log(`\n✓ Complete! Generated ${mobs.length} images`);
    console.log(`  - ${bossCount} boss mobs (crimson)`);
    console.log(`  - ${mobs.length - bossCount} regular mobs`);
    console.log(`\n📁 Location: ${outputDir}`);
    console.log('\n' + '='.repeat(70));
    console.log('  READY TO USE!');
    console.log('='.repeat(70));
    console.log("\nRun 'npm start' to see your pixel art in the Mobs page!\n");
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

