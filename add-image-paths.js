/**
 * Add ImagePath field to each mob in Mobs.json
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('  ADDING IMAGE PATHS TO MOBS.JSON');
console.log('='.repeat(70) + '\n');

// Load mobs
console.log('Loading GameData/Mobs.json...');
const mobsData = fs.readFileSync('GameData/Mobs.json', 'utf8');
const mobs = JSON.parse(mobsData);

console.log(`Found ${mobs.length} mobs\n`);

// Add ImagePath to each mob
console.log('Adding ImagePath field to each mob...');
let updated = 0;
for (const mob of mobs) {
    if (!mob.ImagePath) {
        mob.ImagePath = `/images/mobs/${mob.Id}.png`;
        updated++;
    }
}

console.log(`Updated ${updated} mobs with image paths\n`);

// Save back to GameData
console.log('Saving to GameData/Mobs.json...');
fs.writeFileSync('GameData/Mobs.json', JSON.stringify(mobs, null, 2), 'utf8');

// Also update public version
console.log('Saving to public/GameData/Mobs.json...');
fs.writeFileSync('public/GameData/Mobs.json', JSON.stringify(mobs, null, 2), 'utf8');

console.log('\n✓ Complete!');
console.log('\n' + '='.repeat(70));
console.log('  MOBS.JSON UPDATED WITH IMAGE PATHS');
console.log('='.repeat(70));
console.log('\nEach mob now has an "ImagePath" field pointing to its pixel art!\n');

