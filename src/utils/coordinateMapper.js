/**
 * Coordinate Mapper - Transforms zone/room coordinates to unified world grid
 * This allows seamless zoom from world view down to individual rooms
 * 
 * Grid System:
 * - Each zone gets a dedicated grid cell: 1000x1000 world units
 * - Rooms within zone are positioned relative to zone center
 * - Proper spacing prevents overlaps between zones
 */

// Scale factor: How many world grid units = 1 zone
const ZONE_GRID_SIZE = 1000; // Large spacing to prevent overlaps
const ZONE_DISPLAY_SIZE = 180; // Visual size of zone node at world level
const ROOM_GRID_SIZE = 15;  // pixels per room when fully zoomed
const ROOM_SCALE = 1.5; // Scale factor for room coordinates

/**
 * Convert zone grid coordinates to world pixel coordinates
 */
export function zoneToWorldCoords(gridX, gridY) {
    return {
        worldX: gridX * ZONE_GRID_SIZE,
        worldY: gridY * ZONE_GRID_SIZE
    };
}

/**
 * Convert room coordinates within a zone to world coordinates
 * @param {string} zoneName - Name of the zone
 * @param {number} zoneGridX - Zone's X position in world grid
 * @param {number} zoneGridY - Zone's Y position in world grid
 * @param {number} roomX - Room's X coordinate within zone
 * @param {number} roomY - Room's Y coordinate within zone
 * @param {number} roomZ - Room's Z (floor) coordinate
 */
export function roomToWorldCoords(zoneGridX, zoneGridY, roomX, roomY, roomZ) {
    const zoneWorld = zoneToWorldCoords(zoneGridX, zoneGridY);
    
    // Center the room grid within the zone's allocated space
    // Apply scaling to spread rooms out more
    const roomOffsetX = roomX * ROOM_GRID_SIZE * ROOM_SCALE;
    const roomOffsetY = roomY * ROOM_GRID_SIZE * ROOM_SCALE;
    
    return {
        worldX: zoneWorld.worldX + roomOffsetX,
        worldY: zoneWorld.worldY + roomOffsetY,
        floor: roomZ || 0
    };
}

/**
 * Determine what to render based on zoom level
 * @param {number} zoom - Current zoom level (0.5 to 10+)
 * @returns {string} - 'world', 'zones', or 'rooms'
 */
export function getDetailLevel(zoom) {
    if (zoom < 2) return 'world';      // Show zones as nodes
    if (zoom < 5) return 'zones';      // Show zone boundaries
    return 'rooms';                     // Show individual rooms
}

/**
 * Calculate room bounds for a zone (min/max X,Y coordinates)
 */
export function calculateRoomBounds(rooms) {
    if (!rooms || Object.keys(rooms).length === 0) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    Object.values(rooms).forEach(room => {
        if (room.X < minX) minX = room.X;
        if (room.X > maxX) maxX = room.X;
        if (room.Y < minY) minY = room.Y;
        if (room.Y > maxY) maxY = room.Y;
    });

    return { minX, maxX, minY, maxY };
}

/**
 * Get all floors (Z levels) in a zone
 */
export function getZoneFloors(rooms) {
    if (!rooms) return [0];
    const floors = new Set();
    Object.values(rooms).forEach(room => {
        floors.add(room.Z || 0);
    });
    return Array.from(floors).sort((a, b) => b - a); // Descending order
}

/**
 * Filter rooms by floor
 */
export function filterRoomsByFloor(rooms, floor) {
    if (!rooms) return {};
    const filtered = {};
    Object.entries(rooms).forEach(([id, room]) => {
        if ((room.Z || 0) === floor) {
            filtered[id] = room;
        }
    });
    return filtered;
}

/**
 * Get terrain color for room rendering
 * Handles specific game terrain colors including grey shades
 */
export function getTerrainColor(terrainColor) {
    if (!terrainColor || terrainColor === '') {
        return '#555555'; // Default dark gray for rooms with no terrain color
    }
    
    const colorLower = terrainColor.toLowerCase();
    
    // Specific game colors
    const colorMap = {
        // Browns - caves, underground
        'brown': '#8B4513',
        'darkbrown': '#654321',
        
        // Greys - stone, paths, cities (various shades)
        'grey': '#808080',
        'gray': '#808080',
        'grey40': '#666666',
        'grey50': '#808080',
        'grey60': '#999999',
        'grey70': '#B3B3B3',
        'grey80': '#CCCCCC',
        'darkgrey': '#505050',
        'darkgray': '#505050',
        'lightgrey': '#D3D3D3',
        'lightgray': '#D3D3D3',
        
        // Greens - forests, grass, outdoor
        'green': '#228B22',
        'darkgreen': '#006400',
        'lightgreen': '#90EE90',
        'forestgreen': '#228B22',
        'lawngreen': '#7CFC00',
        
        // Blues - water, ocean, rivers
        'blue': '#4169E1',
        'darkblue': '#00008B',
        'lightblue': '#87CEEB',
        'skyblue': '#87CEEB',
        'navyblue': '#000080',
        'cyan': '#00CED1',
        'aqua': '#00FFFF',
        
        // Yellows/Golds - desert, sand
        'yellow': '#FFD700',
        'gold': '#FFD700',
        'lightyellow': '#FFFFE0',
        'sand': '#F4A460',
        'tan': '#D2B48C',
        
        // Reds - lava, fire, danger
        'red': '#DC143C',
        'darkred': '#8B0000',
        'crimson': '#DC143C',
        'firebrick': '#B22222',
        'orange': '#FF8C00',
        'darkorange': '#FF8C00',
        
        // Purples - magic, mystical
        'purple': '#8B008B',
        'violet': '#EE82EE',
        'magenta': '#FF00FF',
        'darkmagenta': '#8B008B',
        
        // Whites/Ice - snow, frost
        'white': '#F0F0F0',
        'snow': '#FFFAFA',
        'ivory': '#FFFFF0',
        
        // Black/Dark
        'black': '#1a1a1a',
        
        // Pinks
        'pink': '#FFC0CB',
        
        // Special terrains
        'marble': '#C0C0C0',
        'granite': '#808080',
        'grass': '#228B22',
        'dirt': '#8B4513',
        'mud': '#654321',
        'stone': '#708090',
        'rock': '#696969',
        'ice': '#B0E0E6',
        'lava': '#FF4500',
        'water': '#4169E1'
    };
    
    return colorMap[colorLower] || '#555555';
}

/**
 * Check if a bounding box is visible in the viewport
 */
export function isInViewport(elementBounds, viewportBounds) {
    return !(
        elementBounds.right < viewportBounds.left ||
        elementBounds.left > viewportBounds.right ||
        elementBounds.bottom < viewportBounds.top ||
        elementBounds.top > viewportBounds.bottom
    );
}

/**
 * Calculate viewport bounds from viewBox parameters
 */
export function getViewportBounds(viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight) {
    return {
        left: viewBoxX,
        right: viewBoxX + viewBoxWidth,
        top: viewBoxY,
        bottom: viewBoxY + viewBoxHeight
    };
}

/**
 * Get zone bounds in world coordinates
 */
export function getZoneBounds(zoneGridX, zoneGridY, roomBounds) {
    const zoneWorld = zoneToWorldCoords(zoneGridX, zoneGridY);
    const padding = 50;
    
    const width = (roomBounds.maxX - roomBounds.minX + 2) * ROOM_GRID_SIZE * ROOM_SCALE;
    const height = (roomBounds.maxY - roomBounds.minY + 2) * ROOM_GRID_SIZE * ROOM_SCALE;
    const x = zoneWorld.worldX + (roomBounds.minX * ROOM_GRID_SIZE * ROOM_SCALE) - padding;
    const y = zoneWorld.worldY + (roomBounds.minY * ROOM_GRID_SIZE * ROOM_SCALE) - padding;
    
    return {
        left: x,
        right: x + width + padding * 2,
        top: y,
        bottom: y + height + padding * 2,
        centerX: zoneWorld.worldX,
        centerY: zoneWorld.worldY
    };
}

export const CONSTANTS = {
    ZONE_GRID_SIZE,
    ZONE_DISPLAY_SIZE,
    ROOM_GRID_SIZE,
    ROOM_SCALE,
    WORLD_ZOOM_THRESHOLD: 2,   // Below this: world view
    ZONE_ZOOM_THRESHOLD: 5,    // Below this: zone boundaries, above: rooms
    MAX_ZOOM: 20,              // Maximum zoom level (increased for room detail)
    MIN_ZOOM: 0.3              // Minimum zoom level
};

