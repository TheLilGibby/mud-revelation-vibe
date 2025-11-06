/**
 * Node.js Mob Pixel Art Generator
 * Generates 32x32 pixel art for all mobs using canvas
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Check if canvas is installed
let Canvas;
try {
    Canvas = require('canvas');
} catch (err) {
    console.log('\n' + '='.repeat(70));
    console.log('ERROR: canvas module not found');
    console.log('='.repeat(70));
    console.log('\nInstalling canvas...\n');
    
    const { execSync } = require('child_process');
    try {
        execSync('npm install canvas', { stdio: 'inherit' });
        console.log('\n✓ Canvas installed! Restarting generator...\n');
        Canvas = require('canvas');
    } catch (installErr) {
        console.error('Failed to install canvas automatically.');
        console.log('\nPlease run manually: npm install canvas');
        process.exit(1);
    }
}

const { createCanvas } = Canvas;

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
        b: Math.max(0, Math.min(255, color.b + amount))
    };
}

function colorToRgb(color) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function generatePixelArt(mob, size = 32) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Clear with transparency
    ctx.clearRect(0, 0, size, size);
    
    const baseColor = getMobColor(mob);
    const highlight = adjustColor(baseColor, 40);
    const shadow = adjustColor(baseColor, -40);
    
    const isBoss = mob.IsBoss || false;
    
    // Hash mob name to get consistent variant
    const hash = crypto.createHash('md5').update(mob.Name).digest('hex');
    const variant = parseInt(hash.substring(0, 8), 16) % 5;
    
    ctx.imageSmoothingEnabled = false;
    
    if (isBoss) {
        // Boss style
        ctx.fillStyle = colorToRgb(baseColor);
        ctx.fillRect(10, 14, 12, 14); // Body
        ctx.beginPath();
        ctx.ellipse(16, 13, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Red eyes
        ctx.fillStyle = 'rgb(255, 0, 0)';
        ctx.fillRect(13, 11, 1, 1);
        ctx.fillRect(18, 11, 1, 1);
        
        // Arms
        ctx.fillStyle = colorToRgb(shadow);
        ctx.fillRect(8, 16, 2, 8);
        ctx.fillRect(22, 16, 2, 8);
        
        // Crown
        ctx.fillStyle = 'rgb(255, 215, 0)';
        ctx.fillRect(12, 6, 1, 2);
        ctx.fillRect(19, 6, 1, 2);
        
        // Aura
        ctx.fillStyle = colorToRgb(highlight);
        ctx.fillRect(9, 13, 1, 16);
        ctx.fillRect(22, 13, 1, 16);
        
    } else if (variant === 0) {
        // Humanoid
        ctx.fillStyle = colorToRgb(baseColor);
        ctx.fillRect(12, 16, 8, 10); // Body
        
        ctx.fillStyle = colorToRgb(highlight);
        ctx.beginPath();
        ctx.ellipse(16, 13, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(14, 12, 1, 1);
        ctx.fillRect(17, 12, 1, 1);
        
        // Arms
        ctx.fillStyle = colorToRgb(shadow);
        ctx.fillRect(10, 18, 2, 6);
        ctx.fillRect(20, 18, 2, 6);
        
        // Legs
        ctx.fillRect(13, 26, 2, 4);
        ctx.fillRect(17, 26, 2, 4);
        
    } else if (variant === 1) {
        // Beast
        ctx.fillStyle = colorToRgb(baseColor);
        ctx.beginPath();
        ctx.ellipse(16, 19, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colorToRgb(highlight);
        ctx.beginPath();
        ctx.ellipse(22, 14, 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = colorToRgb(baseColor);
        ctx.fillRect(20, 8, 1, 2);
        ctx.fillRect(23, 8, 1, 2);
        
        // Legs
        ctx.fillStyle = colorToRgb(shadow);
        ctx.fillRect(11, 24, 2, 4);
        ctx.fillRect(14, 24, 2, 4);
        ctx.fillRect(17, 24, 2, 4);
        ctx.fillRect(20, 24, 2, 4);
        
    } else if (variant === 2) {
        // Flying
        ctx.fillStyle = colorToRgb(baseColor);
        ctx.beginPath();
        ctx.ellipse(16, 19, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colorToRgb(highlight);
        ctx.beginPath();
        ctx.ellipse(16, 14, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings
        ctx.fillStyle = colorToRgb(shadow);
        ctx.beginPath();
        ctx.moveTo(10, 18);
        ctx.lineTo(14, 16);
        ctx.lineTo(14, 22);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(22, 18);
        ctx.lineTo(18, 16);
        ctx.lineTo(18, 22);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = 'rgb(255, 255, 0)';
        ctx.fillRect(15, 14, 1, 1);
        ctx.fillRect(17, 14, 1, 1);
        
    } else if (variant === 3) {
        // Blob
        ctx.fillStyle = colorToRgb(baseColor);
        ctx.beginPath();
        ctx.ellipse(16, 21, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colorToRgb(highlight);
        ctx.beginPath();
        ctx.ellipse(15, 18, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.beginPath();
        ctx.ellipse(13, 20, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(19, 20, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
        
    } else {
        // Undead
        ctx.fillStyle = 'rgb(240, 240, 240)';
        ctx.beginPath();
        ctx.ellipse(16, 14, 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye sockets
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.beginPath();
        ctx.ellipse(14, 13, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(18, 13, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing eyes
        ctx.fillStyle = colorToRgb(baseColor);
        ctx.fillRect(14, 13, 1, 1);
        ctx.fillRect(18, 13, 1, 1);
        
        // Spine
        ctx.fillStyle = 'rgb(200, 200, 200)';
        ctx.fillRect(14, 18, 4, 10);
        
        // Ribs
        ctx.fillStyle = 'rgb(180, 180, 180)';
        for (let i = 20; i < 26; i += 2) {
            ctx.fillRect(13, i, 6, 1);
        }
    }
    
    return canvas;
}

async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('GENERATING MOB PIXEL ART (Node.js Version)');
    console.log('='.repeat(70) + '\n');
    
    // Load mobs
    console.log('Loading mobs data...');
    const mobsData = fs.readFileSync('GameData/Mobs.json', 'utf8');
    const mobs = JSON.parse(mobsData);
    
    console.log(`Found ${mobs.length} mobs to generate\n`);
    
    // Create output directory
    const outputDir = path.join('public', 'images', 'mobs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    console.log(`Output directory: ${outputDir}\n`);
    
    // Generate images
    console.log('Generating pixel art...');
    for (let i = 0; i < mobs.length; i++) {
        const mob = mobs[i];
        const canvas = generatePixelArt(mob);
        const buffer = canvas.toBuffer('image/png');
        
        const filepath = path.join(outputDir, `${mob.Id}.png`);
        fs.writeFileSync(filepath, buffer);
        
        if ((i + 1) % 100 === 0) {
            console.log(`  ${i + 1}/${mobs.length} images generated...`);
        }
    }
    
    const bossCount = mobs.filter(m => m.IsBoss).length;
    
    console.log(`\n✓ Complete! Generated ${mobs.length} images`);
    console.log(`  - ${bossCount} boss mobs`);
    console.log(`  - ${mobs.length - bossCount} regular mobs`);
    console.log(`\n📁 Location: ${outputDir}`);
    console.log('\n' + '='.repeat(70));
    console.log('READY TO USE!');
    console.log('='.repeat(70));
    console.log("\nRun 'npm start' and check the Mobs page to see your pixel art!\n");
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

