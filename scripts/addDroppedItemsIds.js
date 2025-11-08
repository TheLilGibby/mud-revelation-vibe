const fs = require('fs');
const path = require('path');

console.log('Starting DroppedItemsIds migration for Mobs...');

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

// Normalize mob name for comparison (removes articles)
const normalizeMobName = (name) => {
    if (!name) return '';
    
    let cleaned = name
        .replace(/\\cf\d+/gi, '')
        .replace(/\\cf\w+/gi, '')
        .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, '')
        .trim()
        .replace(/\.$/, '');
    
    // Normalize articles - remove leading "A ", "An ", "The "
    cleaned = cleaned.replace(/^(A|An|The)\s+/i, '');
    
    return cleaned.toLowerCase();
};

// Create a map of normalized mob names to mob indices for faster lookup
console.log('Creating mob name -> index map...');
const mobNameToIndexMap = new Map();
for (let i = 0; i < mobs.length; i++) {
    const normalizedName = normalizeMobName(mobs[i].Name);
    if (!mobNameToIndexMap.has(normalizedName)) {
        mobNameToIndexMap.set(normalizedName, []);
    }
    mobNameToIndexMap.get(normalizedName).push(i);
}
console.log(`Created map with ${mobNameToIndexMap.size} unique mob names`);

// Initialize DroppedItemsIds for all mobs
console.log('\nInitializing DroppedItemsIds arrays...');
for (const mob of mobs) {
    mob.DroppedItemsIds = [];
}

// Create item name lookup map (for matching DroppedItems in Mobs.json)
console.log('\nCreating item name -> ID map...');
const itemNameToIdMap = new Map();
for (const item of items) {
    const cleanName = cleanMobName(item.Name).toLowerCase();
    if (!itemNameToIdMap.has(cleanName)) {
        itemNameToIdMap.set(cleanName, []);
    }
    itemNameToIdMap.get(cleanName).push(item.Id);
}
console.log(`Created map with ${itemNameToIdMap.size} unique item names`);

// STEP 1: Process Items.json DroppedBy field
let itemsProcessed = 0;
let itemsWithDrops = 0;
let totalDropAssignments = 0;
const notFoundMobs = new Set();

console.log('\nStep 1: Processing Items.json DroppedBy field...');
for (const item of items) {
    itemsProcessed++;
    
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
        
        if (droppingMobNames.length > 0) {
            itemsWithDrops++;
        }
        
        // Look up each mob name and add this item's ID
        for (const mobName of droppingMobNames) {
            const normalizedName = normalizeMobName(mobName);
            const mobIndices = mobNameToIndexMap.get(normalizedName);
            
            if (mobIndices && mobIndices.length > 0) {
                // Add this item ID to all matching mobs
                for (const mobIndex of mobIndices) {
                    if (!mobs[mobIndex].DroppedItemsIds.includes(item.Id)) {
                        mobs[mobIndex].DroppedItemsIds.push(item.Id);
                        totalDropAssignments++;
                    }
                }
            } else {
                notFoundMobs.add(mobName);
            }
        }
    }
    
    // Progress indicator
    if (itemsProcessed % 200 === 0) {
        process.stdout.write(`\rProcessed ${itemsProcessed}/${items.length} items...`);
    }
}
console.log(`\rProcessed ${itemsProcessed}/${items.length} items... Done!`);

// STEP 2: Process Mobs.json DroppedItems field
console.log('\nStep 2: Processing Mobs.json DroppedItems field...');
let mobsProcessedForItems = 0;
let mobsWithDroppedItems = 0;
let itemsFoundInMobs = 0;
let itemsNotFoundInMobs = 0;
const notFoundItems = new Set();

for (const mob of mobs) {
    mobsProcessedForItems++;
    
    // Check if mob has DroppedItems array (item names)
    if (mob.DroppedItems && Array.isArray(mob.DroppedItems) && mob.DroppedItems.length > 0) {
        mobsWithDroppedItems++;
        
        for (const itemName of mob.DroppedItems) {
            if (typeof itemName !== 'string' || itemName.trim() === '') continue;
            
            // Clean and normalize the item name
            const cleanName = cleanMobName(itemName).toLowerCase();
            const itemIds = itemNameToIdMap.get(cleanName);
            
            if (itemIds && itemIds.length > 0) {
                // Add all matching item IDs
                for (const itemId of itemIds) {
                    if (!mob.DroppedItemsIds.includes(itemId)) {
                        mob.DroppedItemsIds.push(itemId);
                        totalDropAssignments++;
                        itemsFoundInMobs++;
                    }
                }
            } else {
                notFoundItems.add(itemName);
                itemsNotFoundInMobs++;
            }
        }
    }
    
    // Progress indicator
    if (mobsProcessedForItems % 100 === 0) {
        process.stdout.write(`\rProcessed ${mobsProcessedForItems}/${mobs.length} mobs...`);
    }
}
console.log(`\rProcessed ${mobsProcessedForItems}/${mobs.length} mobs... Done!`);
console.log(`Mobs with DroppedItems field: ${mobsWithDroppedItems}`);
console.log(`Items found and matched: ${itemsFoundInMobs}`);
console.log(`Items not found: ${itemsNotFoundInMobs}`);

// Count mobs with drops
const mobsWithDrops = mobs.filter(mob => mob.DroppedItemsIds.length > 0).length;
const mobsWithoutDrops = mobs.length - mobsWithDrops;

console.log('\n=== Migration Summary ===');
console.log(`Total mobs processed: ${mobs.length}`);
console.log(`Mobs with drops assigned: ${mobsWithDrops}`);
console.log(`Mobs without drops: ${mobsWithoutDrops}`);
console.log(`Total items processed: ${itemsProcessed}`);
console.log(`Items with DroppedBy data: ${itemsWithDrops}`);
console.log(`Total drop assignments made: ${totalDropAssignments}`);

if (notFoundMobs.size > 0) {
    console.log(`\nMob names not found in Mobs.json (${notFoundMobs.size}):`);
    const sortedNotFound = Array.from(notFoundMobs).sort();
    sortedNotFound.slice(0, 20).forEach(name => console.log(`  - "${name}"`));
    if (sortedNotFound.length > 20) {
        console.log(`  ... and ${sortedNotFound.length - 20} more`);
    }
}

if (notFoundItems.size > 0) {
    console.log(`\nItem names not found in Items.json (${notFoundItems.size}):`);
    const sortedNotFoundItems = Array.from(notFoundItems).sort();
    sortedNotFoundItems.slice(0, 20).forEach(name => console.log(`  - "${name}"`));
    if (sortedNotFoundItems.length > 20) {
        console.log(`  ... and ${sortedNotFoundItems.length - 20} more`);
    }
}

// Find top 10 mobs with most drops
const topMobs = mobs
    .filter(mob => mob.DroppedItemsIds.length > 0)
    .sort((a, b) => b.DroppedItemsIds.length - a.DroppedItemsIds.length)
    .slice(0, 10);

console.log('\nTop 10 mobs by number of drops:');
topMobs.forEach((mob, i) => {
    console.log(`  ${i + 1}. ${cleanMobName(mob.Name)} - ${mob.DroppedItemsIds.length} items (Level ${mob.Level})`);
});

// Write the updated mobs back to file
console.log('\nWriting updated Mobs.json...');
fs.writeFileSync(mobsPath, JSON.stringify(mobs, null, 2), 'utf8');
console.log('✓ Migration complete!');
console.log(`\nUpdated file: ${mobsPath}`);


