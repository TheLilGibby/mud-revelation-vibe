/**
 * Load and process real MUD room data from WorldData.json
 * This replaces procedural generation with actual game data
 */

// Import the real world data
// Note: This will be dynamically loaded
let worldDataCache = null;

export async function loadWorldData() {
    if (worldDataCache) {
        return worldDataCache;
    }

    try {
        const response = await fetch('/GameData/WorldData.json');
        const data = await response.json();
        worldDataCache = data;
        return data;
    } catch (error) {
        console.error('Failed to load WorldData.json:', error);
        return null;
    }
}

export function findZoneByLocationName(worldData, locationName) {
    if (!worldData || !worldData.Zones) return null;

    // FIRST: Try exact match with zone KEY (most reliable)
    // This fixes the desync bug where zone keys like "ancient_caverns" 
    // weren't matching ZoneNames like "The Ancient Caverns"
    const exactKeyMatch = worldData.Zones[locationName];
    if (exactKeyMatch) {
        return { key: locationName, data: exactKeyMatch };
    }

    // SECOND: Try case-insensitive zone KEY match
    const lowerLocationName = locationName.toLowerCase();
    for (const [zoneKey, zoneData] of Object.entries(worldData.Zones)) {
        if (zoneKey.toLowerCase() === lowerLocationName) {
            return { key: zoneKey, data: zoneData };
        }
    }

    // THIRD: Try exact match with ZoneName field
    for (const [zoneKey, zoneData] of Object.entries(worldData.Zones)) {
        if (zoneData.ZoneName.toLowerCase() === lowerLocationName) {
            return { key: zoneKey, data: zoneData };
        }
    }

    // FOURTH: Try partial match with zone KEY
    for (const [zoneKey, zoneData] of Object.entries(worldData.Zones)) {
        if (zoneKey.toLowerCase().includes(lowerLocationName) ||
            lowerLocationName.includes(zoneKey.toLowerCase())) {
            return { key: zoneKey, data: zoneData };
        }
    }

    // FIFTH: Try partial match with ZoneName (fallback)
    for (const [zoneKey, zoneData] of Object.entries(worldData.Zones)) {
        if (zoneData.ZoneName.toLowerCase().includes(lowerLocationName) ||
            lowerLocationName.includes(zoneData.ZoneName.toLowerCase())) {
            return { key: zoneKey, data: zoneData };
        }
    }

    return null;
}

export function convertRoomDataForDisplay(zoneData) {
    if (!zoneData || !zoneData.Rooms) return null;

    const rooms = Object.values(zoneData.Rooms);
    
    // Calculate grid bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    rooms.forEach(room => {
        minX = Math.min(minX, room.X);
        maxX = Math.max(maxX, room.X);
        minY = Math.min(minY, room.Y);
        maxY = Math.max(maxY, room.Y);
        minZ = Math.min(minZ, room.Z);
        maxZ = Math.max(maxZ, room.Z);
    });

    const gridWidth = maxX - minX + 1;
    const gridHeight = maxY - minY + 1;
    const levels = maxZ - minZ + 1;

    return {
        zoneName: zoneData.ZoneName,
        totalRooms: zoneData.TotalRooms,
        rooms: rooms.map(room => ({
            id: room.RoomId,
            name: room.Name,
            description: room.Description,
            position: {
                x: room.X - minX, // Normalize to 0-based
                y: room.Y - minY,
                z: room.Z - minZ
            },
            originalPosition: {
                x: room.X,
                y: room.Y,
                z: room.Z
            },
            exits: {
                north: room.ExitNorth,
                south: room.ExitSouth,
                east: room.ExitEast,
                west: room.ExitWest,
                up: room.ExitUp,
                down: room.ExitDown
            },
            npcs: (room.Npcs || []).map(npc => ({
                name: npc.NpcName,
                respawnRate: npc.RespawnRate
            })),
            terrainColor: room.TerrainColor || 'brown',
            isZoneExit: room.IsZoneExit || false,
            exitToZone: room.ExitToZone || '',
            connectedRooms: room.ConnectedRooms || []
        })),
        gridSize: {
            width: gridWidth,
            height: gridHeight,
            levels: levels
        },
        bounds: {
            minX, maxX, minY, maxY, minZ, maxZ
        }
    };
}

export function getRoomAt(roomData, x, y, z = 0) {
    if (!roomData || !roomData.rooms) return null;
    
    return roomData.rooms.find(room => 
        room.position.x === x && 
        room.position.y === y && 
        room.position.z === z
    );
}

export function getTerrainColor(terrainType) {
    // Color mapping to match the actual MUD game client colors EXACTLY
    const colorMap = {
        // Greens - most common in fields
        'ltgreen': '#00BB00',        // Light green for fields
        'wetgreen': '#00BB00',        // Same as ltgreen
        'green': '#00BB00',          // Standard green
        
        // Browns/oranges - roads, dirt
        'brown': '#CC6600',          // Orange-brown
        'orange': '#CC6600',         // Orange
        'dkbrown': '#996633',        // Dark brown
        
        // Grays - stone, walls
        'grey40': '#666666',         // Dark gray
        'grey60': '#999999',         // Medium gray
        'grey70': '#B3B3B3',         // Light gray
        'gray': '#808080',           // Generic gray
        'grey': '#808080',           // Generic grey
        
        // Blues - water
        'blue': '#0000CC',           // Blue water
        'ltblue': '#6666FF',         // Light blue
        'dkblue': '#000088',         // Dark blue
        
        // Reds - danger zones, lava
        'red': '#FF0000',            // Bright red
        'dkred': '#CC0000',          // Dark red
        
        // Special terrains
        'midnight': '#000033',       // Very dark blue/black
        'lusciouspurp': '#CC00CC',   // Purple
        'purple': '#9933CC',         // Purple
        'yellow': '#FFFF00',         // Yellow
        'white': '#FFFFFF',          // White
        'black': '#000000',          // Black
        'cyan': '#00FFFF',           // Cyan
        'pink': '#FF99CC',           // Pink
        
        // Default
        'default': '#999999'
    };

    // Try exact match first
    const exact = colorMap[terrainType.toLowerCase()];
    if (exact) return exact;
    
    // Try partial match for variations
    const lowerTerrain = terrainType.toLowerCase();
    for (const [key, color] of Object.entries(colorMap)) {
        if (lowerTerrain.includes(key) || key.includes(lowerTerrain)) {
            return color;
        }
    }
    
    // Default to gray if unknown
    return colorMap['default'];
}

