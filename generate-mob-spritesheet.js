/**
 * Generate a single sprite sheet containing all mob pixel art.
 * This dramatically improves performance by reducing 1046 HTTP requests to just 1.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Color utilities
function getMobColor(mob) {
    // Boss mobs - dark red/purple
    if (mob.IsBoss) {
        return [180, 20, 60]; // Crimson
    }
    
    // Level-based colors
    const level = mob.Level || 1;
    
    if (level >= 100) return [138, 43, 226];  // Purple - High level
    if (level >= 75) return [255, 69, 0];     // Red-Orange - Very high
    if (level >= 50) return [255, 140, 0];    // Dark Orange - High
    if (level >= 25) return [255, 215, 0];    // Gold - Medium
    if (level >= 10) return [50, 205, 50];    // Lime Green - Low-Medium
    return [100, 149, 237]; // Cornflower Blue - Low level
}

function createColorString(rgb, alpha = 255) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha / 255})`;
}

function adjustColor(rgb, amount) {
    return rgb.map(c => Math.max(0, Math.min(255, c + amount)));
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function generatePixelArt(ctx, mob, size = 32) {
    // Get mob color
    const baseColor = getMobColor(mob);
    const highlight = adjustColor(baseColor, 40);
    const shadow = adjustColor(baseColor, -40);
    
    const isBoss = mob.IsBoss || false;
    const variant = hashString(mob.Name) % 5;
    
    if (isBoss) {
        // Boss - larger, more imposing
        ctx.fillStyle = createColorString(baseColor);
        ctx.fillRect(10, 14, 12, 14); // Body
        ctx.beginPath();
        ctx.ellipse(16, 13, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill(); // Head
        
        ctx.fillStyle = createColorString([255, 0, 0]);
        ctx.fillRect(13, 11, 1, 1); // Eye 1
        ctx.fillRect(18, 11, 1, 1); // Eye 2
        
        ctx.fillStyle = createColorString(shadow);
        ctx.fillRect(8, 16, 2, 8); // Arm 1
        ctx.fillRect(22, 16, 2, 8); // Arm 2
        
        ctx.fillStyle = createColorString([255, 215, 0]);
        ctx.fillRect(12, 6, 1, 2); // Crown 1
        ctx.fillRect(19, 6, 1, 2); // Crown 2
        
        ctx.fillStyle = createColorString(highlight);
        ctx.fillRect(9, 13, 1, 16); // Aura 1
        ctx.fillRect(22, 13, 1, 16); // Aura 2
        
    } else if (variant === 0) {
        // Humanoid style
        ctx.fillStyle = createColorString(baseColor);
        ctx.fillRect(12, 16, 8, 10); // Body
        
        ctx.fillStyle = createColorString(highlight);
        ctx.beginPath();
        ctx.ellipse(16, 13, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill(); // Head
        
        ctx.fillStyle = createColorString([0, 0, 0]);
        ctx.fillRect(14, 12, 1, 1); // Eye 1
        ctx.fillRect(17, 12, 1, 1); // Eye 2
        
        ctx.fillStyle = createColorString(shadow);
        ctx.fillRect(10, 18, 2, 6); // Arm 1
        ctx.fillRect(20, 18, 2, 6); // Arm 2
        ctx.fillRect(13, 26, 2, 4); // Leg 1
        ctx.fillRect(17, 26, 2, 4); // Leg 2
        
    } else if (variant === 1) {
        // Beast/quadruped style
        ctx.fillStyle = createColorString(baseColor);
        ctx.beginPath();
        ctx.ellipse(16, 19, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill(); // Body
        
        ctx.fillStyle = createColorString(highlight);
        ctx.beginPath();
        ctx.ellipse(22, 14, 4, 4, 0, 0, Math.PI * 2);
        ctx.fill(); // Head
        
        ctx.fillStyle = createColorString(baseColor);
        ctx.fillRect(20, 8, 1, 2); // Ear 1
        ctx.fillRect(23, 8, 1, 2); // Ear 2
        
        ctx.fillStyle = createColorString(shadow);
        ctx.fillRect(11, 24, 2, 4); // Leg 1
        ctx.fillRect(14, 24, 2, 4); // Leg 2
        ctx.fillRect(17, 24, 2, 4); // Leg 3
        ctx.fillRect(20, 24, 2, 4); // Leg 4
        
    } else if (variant === 2) {
        // Flying creature
        ctx.fillStyle = createColorString(baseColor);
        ctx.beginPath();
        ctx.ellipse(16, 19, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill(); // Body
        
        ctx.fillStyle = createColorString(highlight);
        ctx.beginPath();
        ctx.ellipse(16, 14, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill(); // Head
        
        ctx.fillStyle = createColorString(shadow);
        ctx.beginPath();
        ctx.moveTo(10, 18);
        ctx.lineTo(14, 16);
        ctx.lineTo(14, 22);
        ctx.fill(); // Wing 1
        
        ctx.beginPath();
        ctx.moveTo(22, 18);
        ctx.lineTo(18, 16);
        ctx.lineTo(18, 22);
        ctx.fill(); // Wing 2
        
        ctx.fillStyle = createColorString([255, 255, 0]);
        ctx.fillRect(15, 14, 1, 1); // Eye 1
        ctx.fillRect(17, 14, 1, 1); // Eye 2
        
    } else if (variant === 3) {
        // Blob/slime style
        ctx.fillStyle = createColorString(baseColor);
        ctx.beginPath();
        ctx.ellipse(16, 21, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill(); // Main body
        
        ctx.fillStyle = createColorString(highlight);
        ctx.beginPath();
        ctx.ellipse(15, 18, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill(); // Highlight
        
        ctx.fillStyle = createColorString([0, 0, 0]);
        ctx.beginPath();
        ctx.ellipse(13, 20, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill(); // Eye 1
        
        ctx.beginPath();
        ctx.ellipse(19, 20, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill(); // Eye 2
        
        ctx.beginPath();
        ctx.arc(16, 23, 3, 0, Math.PI);
        ctx.stroke(); // Mouth
        
    } else {
        // Undead/skeletal
        ctx.fillStyle = createColorString([240, 240, 240]);
        ctx.beginPath();
        ctx.ellipse(16, 14, 4, 4, 0, 0, Math.PI * 2);
        ctx.fill(); // Skull
        
        ctx.fillStyle = createColorString([0, 0, 0]);
        ctx.beginPath();
        ctx.ellipse(14, 13, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill(); // Eye socket 1
        
        ctx.beginPath();
        ctx.ellipse(18, 13, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill(); // Eye socket 2
        
        ctx.fillStyle = createColorString(baseColor);
        ctx.fillRect(14, 13, 1, 1); // Glowing eye 1
        ctx.fillRect(18, 13, 1, 1); // Glowing eye 2
        
        ctx.fillStyle = createColorString([200, 200, 200]);
        ctx.fillRect(14, 18, 4, 10); // Spine/body
        
        ctx.fillStyle = createColorString([180, 180, 180]);
        for (let i = 20; i < 26; i += 2) {
            ctx.fillRect(13, i, 6, 1); // Ribs
        }
    }
}

async function main() {
    console.log('Loading mobs data...');
    const mobsData = JSON.parse(fs.readFileSync('GameData/Mobs.json', 'utf-8'));
    
    const numMobs = mobsData.length;
    const spriteSize = 32;
    
    // Calculate grid dimensions (roughly square)
    const cols = Math.ceil(Math.sqrt(numMobs));
    const rows = Math.ceil(numMobs / cols);
    
    console.log(`Creating sprite sheet for ${numMobs} mobs...`);
    console.log(`Grid: ${cols} columns x ${rows} rows`);
    console.log(`Sprite size: ${spriteSize}x${spriteSize} pixels`);
    
    // Create canvas
    const sheetWidth = cols * spriteSize;
    const sheetHeight = rows * spriteSize;
    const canvas = createCanvas(sheetWidth, sheetHeight);
    const ctx = canvas.getContext('2d');
    
    console.log(`Sprite sheet dimensions: ${sheetWidth}x${sheetHeight} pixels`);
    
    // Create mapping data
    const spriteMap = {};
    
    // Generate and place each mob sprite
    for (let i = 0; i < mobsData.length; i++) {
        const mob = mobsData[i];
        const mobId = mob.Id;
        
        // Calculate position in grid
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * spriteSize;
        const y = row * spriteSize;
        
        // Save context and translate to sprite position
        ctx.save();
        ctx.translate(x, y);
        
        // Generate the pixel art
        generatePixelArt(ctx, mob, spriteSize);
        
        ctx.restore();
        
        // Store mapping (mob ID -> position)
        spriteMap[mobId.toString()] = {
            x: x,
            y: y,
            width: spriteSize,
            height: spriteSize,
            col: col,
            row: row
        };
        
        // Progress indicator
        if ((i + 1) % 100 === 0) {
            console.log(`  Processed ${i + 1}/${numMobs} sprites...`);
        }
    }
    
    // Save sprite sheet
    const outputDir = 'public/images';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const spriteSheetPath = path.join(outputDir, 'mob-spritesheet.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(spriteSheetPath, buffer);
    
    console.log(`\n✅ Sprite sheet saved: ${spriteSheetPath}`);
    console.log(`   File size: ${(buffer.length / 1024).toFixed(1)} KB`);
    
    // Save sprite mapping
    const mapPath = path.join(outputDir, 'mob-spritesheet.json');
    fs.writeFileSync(mapPath, JSON.stringify({
        spriteSize: spriteSize,
        cols: cols,
        rows: rows,
        sheetWidth: sheetWidth,
        sheetHeight: sheetHeight,
        totalMobs: numMobs,
        sprites: spriteMap
    }, null, 2));
    
    console.log(`✅ Sprite mapping saved: ${mapPath}`);
    
    // Calculate performance improvement
    const oldRequests = numMobs;
    const newRequests = 2; // 1 sprite sheet + 1 JSON map
    const reduction = ((oldRequests - newRequests) / oldRequests) * 100;
    
    console.log(`\n🚀 Performance Improvement:`);
    console.log(`   Before: ${oldRequests} HTTP requests`);
    console.log(`   After: ${newRequests} HTTP requests`);
    console.log(`   Reduction: ${reduction.toFixed(1)}%`);
    console.log(`\n✨ Sprite sheet generation complete!`);
}

main().catch(err => {
    console.error('Error generating sprite sheet:', err);
    process.exit(1);
});

