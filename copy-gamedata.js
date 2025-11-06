// Simple script to copy GameData files to public folder
const fs = require('fs');
const path = require('path');

console.log('Copying GameData to public folder...\n');

// Create public/GameData directory if it doesn't exist
const publicGameDataDir = path.join(__dirname, 'public', 'GameData');
if (!fs.existsSync(publicGameDataDir)) {
    fs.mkdirSync(publicGameDataDir, { recursive: true });
    console.log('✓ Created public/GameData directory');
}

// Copy WorldData.json
try {
    const worldDataSource = path.join(__dirname, 'GameData', 'WorldData.json');
    const worldDataDest = path.join(publicGameDataDir, 'WorldData.json');
    fs.copyFileSync(worldDataSource, worldDataDest);
    console.log('✓ Copied WorldData.json');
} catch (err) {
    console.error('✗ Failed to copy WorldData.json:', err.message);
    process.exit(1);
}

// Copy EnabledZones.json
try {
    const zonesSource = path.join(__dirname, 'GameData', 'EnabledZones.json');
    const zonesDest = path.join(publicGameDataDir, 'EnabledZones.json');
    fs.copyFileSync(zonesSource, zonesDest);
    console.log('✓ Copied EnabledZones.json');
} catch (err) {
    console.error('✗ Failed to copy EnabledZones.json:', err.message);
    process.exit(1);
}

// Copy Mobs.json
try {
    const mobsSource = path.join(__dirname, 'GameData', 'Mobs.json');
    const mobsDest = path.join(publicGameDataDir, 'Mobs.json');
    fs.copyFileSync(mobsSource, mobsDest);
    console.log('✓ Copied Mobs.json');
} catch (err) {
    console.error('✗ Failed to copy Mobs.json:', err.message);
    process.exit(1);
}

console.log('\n✓ All GameData files copied successfully!');
console.log('\nYou can now start the React app with: npm start');

