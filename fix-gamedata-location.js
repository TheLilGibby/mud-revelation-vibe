// Move WorldData.json files to correct location
const fs = require('fs');
const path = require('path');

console.log('Fixing GameData location...\n');

// Create public/GameData directory
const publicGameDataDir = path.join(__dirname, 'public', 'GameData');
if (!fs.existsSync(publicGameDataDir)) {
    fs.mkdirSync(publicGameDataDir, { recursive: true });
    console.log('✓ Created public/GameData directory');
}

// Move WorldData.json
try {
    const worldDataSource = path.join(__dirname, 'public', 'WorldData.json');
    const worldDataDest = path.join(publicGameDataDir, 'WorldData.json');
    
    if (fs.existsSync(worldDataSource)) {
        fs.renameSync(worldDataSource, worldDataDest);
        console.log('✓ Moved WorldData.json to GameData folder');
    } else {
        // Copy from GameData if not in public
        const originalSource = path.join(__dirname, 'GameData', 'WorldData.json');
        fs.copyFileSync(originalSource, worldDataDest);
        console.log('✓ Copied WorldData.json to GameData folder');
    }
} catch (err) {
    console.error('✗ Error with WorldData.json:', err.message);
}

// Move EnabledZones.json
try {
    const zonesSource = path.join(__dirname, 'public', 'EnabledZones.json');
    const zonesDest = path.join(publicGameDataDir, 'EnabledZones.json');
    
    if (fs.existsSync(zonesSource)) {
        fs.renameSync(zonesSource, zonesDest);
        console.log('✓ Moved EnabledZones.json to GameData folder');
    } else {
        // Copy from GameData if not in public
        const originalSource = path.join(__dirname, 'GameData', 'EnabledZones.json');
        fs.copyFileSync(originalSource, zonesDest);
        console.log('✓ Copied EnabledZones.json to GameData folder');
    }
} catch (err) {
    console.error('✗ Error with EnabledZones.json:', err.message);
}

console.log('\n✓ Files are now in the correct location!');
console.log('  public/GameData/WorldData.json');
console.log('  public/GameData/EnabledZones.json');
console.log('\nRestart your React app (Ctrl+C then npm start) and try Epiach again!');

