/**
 * Load and process mob data from Mobs.json
 */

let mobDataCache = null;

export async function loadMobData() {
    if (mobDataCache) {
        return mobDataCache;
    }

    try {
        const response = await fetch('/GameData/Mobs.json');
        const data = await response.json();
        mobDataCache = data;
        return data;
    } catch (error) {
        console.error('Failed to load Mobs.json:', error);
        return null;
    }
}

export function findMobByName(mobData, mobName) {
    if (!mobData) return null;
    
    // Exact match first
    let mob = mobData.find(m => m.Name === mobName);
    if (mob) return mob;
    
    // Try case-insensitive
    mob = mobData.find(m => m.Name.toLowerCase() === mobName.toLowerCase());
    if (mob) return mob;
    
    // Try partial match
    mob = mobData.find(m => 
        m.Name.toLowerCase().includes(mobName.toLowerCase()) ||
        mobName.toLowerCase().includes(m.Name.toLowerCase())
    );
    
    return mob;
}

export function getMobsInZone(mobData, zoneName) {
    if (!mobData) return [];
    
    return mobData.filter(mob => {
        if (!mob.Location) return false;
        
        // Location can be comma-separated list
        const locations = mob.Location.split(',').map(l => l.trim().toLowerCase());
        const searchZone = zoneName.toLowerCase().trim();
        
        // Only exact match - no includes to prevent false matches
        // e.g., "Myronmet" should NOT match "New Myronmet"
        return locations.some(loc => loc === searchZone);
    });
}

export function getMobTierColor(tier) {
    const tierColors = {
        'Mobs': '#00FF00',          // Green - normal
        'Elite Mob': '#0088FF',      // Blue - elite  
        'Boss': '#FF00FF',           // Purple - boss
        'Event Mob': '#FFD700',      // Gold - event
        'Rare Mob': '#00FFFF',       // Cyan - rare
        'World Boss': '#FF0000',     // Red - world boss
    };
    
    return tierColors[tier] || '#FFFFFF';
}

export function getMobDifficultyText(difficulty) {
    const difficultyMap = {
        0: 'Normal',
        1: 'Easy',
        2: 'Medium',
        3: 'Hard',
        4: 'Very Hard',
        5: 'Elite',
        6: 'Boss'
    };
    
    return difficultyMap[difficulty] || 'Normal';
}

/**
 * Get all zones where a specific mob appears
 * @param {Object} mob - The mob object with Location field
 * @returns {Array} Array of zone names where the mob appears
 */
export function getMobZones(mob) {
    if (!mob || !mob.Location) return [];
    
    // Location can be comma-separated list
    const locations = mob.Location.split(',').map(l => l.trim());
    return locations;
}

/**
 * Get all zones for multiple mobs
 * @param {Array} mobs - Array of mob objects
 * @returns {Array} Unique array of zone names
 */
export function getZonesForMobs(mobs) {
    if (!mobs || mobs.length === 0) return [];
    
    const zones = new Set();
    mobs.forEach(mob => {
        getMobZones(mob).forEach(zone => zones.add(zone));
    });
    
    return Array.from(zones);
}

