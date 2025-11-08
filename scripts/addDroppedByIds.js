const fs = require('fs');
const path = require('path');

console.log('Starting DroppedByIds migration...');

// Read the files
const itemsPath = path.join(__dirname, '../public/GameData/Items.json');
const mobsPath = path.join(__dirname, '../public/GameData/Mobs.json');

console.log('Reading Items.json...');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
console.log(`Loaded ${items.length} items`);

console.log('Reading Mobs.json...');
const mobs = JSON.parse(fs.readFileSync(mobsPath, 'utf8'));
console.log(`Loaded ${mobs.length} mobs`);

// Clean mob names (remove color codes)
const cleanMobName = (name) => {
    if (!name) return '';
    return name.replace(/\\cf\d+/gi, '').replace(/\\cf\w+/gi, '').trim().replace(/\.$/, '');
};

// Create a map of mob names to mob IDs for faster lookup
console.log('Creating mob name -> ID map...');
const mobNameToIdMap = new Map();
for (const mob of mobs) {
    const cleanName = cleanMobName(mob.Name).toLowerCase();
    if (!mobNameToIdMap.has(cleanName)) {
        mobNameToIdMap.set(cleanName, []);
    }
    mobNameToIdMap.get(cleanName).push(mob.Id);
}
console.log(`Created map with ${mobNameToIdMap.size} unique mob names`);

// Process each item
let itemsWithDrops = 0;
let itemsWithoutDrops = 0;
let totalMobsFound = 0;
let totalMobsNotFound = 0;
const notFoundMobs = new Set();

console.log('\nProcessing items...');
for (const item of items) {
    // Initialize DroppedByIds as empty array
    item.DroppedByIds = [];
    
    // Parse DroppedBy field
    if (item.DroppedBy && typeof item.DroppedBy === 'string' && item.DroppedBy.trim() !== '') {
        // Split by comma and clean up each mob name
        const droppingMobNames = item.DroppedBy
            .split(',')
            .map(name => {
                // Remove superscript numbers (¹²³⁴⁵⁶⁷⁸⁹⁰)
                return name.replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '').trim();
            })
            .filter(name => name.length > 0);
        
        // Look up each mob name and add IDs
        for (const mobName of droppingMobNames) {
            const cleanName = mobName.toLowerCase();
            const mobIds = mobNameToIdMap.get(cleanName);
            
            if (mobIds && mobIds.length > 0) {
                // Add all matching mob IDs (in case there are duplicates)
                item.DroppedByIds.push(...mobIds);
                totalMobsFound++;
            } else {
                totalMobsNotFound++;
                notFoundMobs.add(mobName);
            }
        }
        
        // Remove duplicates from DroppedByIds
        item.DroppedByIds = [...new Set(item.DroppedByIds)];
        
        if (item.DroppedByIds.length > 0) {
            itemsWithDrops++;
        } else {
            itemsWithoutDrops++;
        }
    } else {
        itemsWithoutDrops++;
    }
}

console.log('\n=== Migration Summary ===');
console.log(`Total items processed: ${items.length}`);
console.log(`Items with drops found: ${itemsWithDrops}`);
console.log(`Items without drops: ${itemsWithoutDrops}`);
console.log(`Mob names successfully matched: ${totalMobsFound}`);
console.log(`Mob names not found: ${totalMobsNotFound}`);

if (notFoundMobs.size > 0) {
    console.log(`\nMob names not found in Mobs.json (${notFoundMobs.size}):`);
    const sortedNotFound = Array.from(notFoundMobs).sort();
    sortedNotFound.slice(0, 20).forEach(name => console.log(`  - "${name}"`));
    if (sortedNotFound.length > 20) {
        console.log(`  ... and ${sortedNotFound.length - 20} more`);
    }
}

// Write the updated items back to file
console.log('\nWriting updated Items.json...');
fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2), 'utf8');
console.log('✓ Migration complete!');
console.log(`\nUpdated file: ${itemsPath}`);



