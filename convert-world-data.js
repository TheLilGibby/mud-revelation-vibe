const fs = require('fs');

console.log("=" .repeat(60));
console.log("  IMPORTING REAL MUD ROOM DATA");
console.log("=".repeat(60));
console.log();

// Load WorldData.json
console.log("Loading WorldData.json...");
const worldData = JSON.parse(fs.readFileSync('GameData/WorldData.json', 'utf8'));

console.log(`Found ${Object.keys(worldData.Zones).length} zones!`);
console.log();

// Convert to our format
const convertedData = {};
let totalRooms = 0;

for (const [zoneKey, zoneData] of Object.entries(worldData.Zones)) {
    const zoneName = zoneData.ZoneName;
    
    console.log(`Processing: ${zoneName} (${zoneData.TotalRooms} rooms)`);
    
    // Convert rooms
    const rooms = [];
    for (const [roomId, roomData] of Object.entries(zoneData.Rooms)) {
        const room = {
            id: roomData.RoomId,
            name: roomData.Name,
            description: roomData.Description,
            position: {
                x: roomData.X,
                y: roomData.Y,
                z: roomData.Z
            },
            exits: {
                north: roomData.ExitNorth,
                south: roomData.ExitSouth,
                east: roomData.ExitEast,
                west: roomData.ExitWest,
                up: roomData.ExitUp,
                down: roomData.ExitDown
            },
            npcs: (roomData.Npcs || []).map(npc => npc.NpcName),
            terrainColor: roomData.TerrainColor || 'brown',
            isZoneExit: roomData.IsZoneExit || false,
            exitToZone: roomData.ExitToZone || '',
            connectedRooms: roomData.ConnectedRooms || []
        };
        rooms.push(room);
    }
    
    convertedData[zoneName] = {
        zoneName: zoneName,
        fileKey: zoneKey,
        totalRooms: zoneData.TotalRooms,
        rooms: rooms
    };
    
    totalRooms += zoneData.TotalRooms;
}

// Save to React-friendly format
const outputFile = 'src/realWorldMaps.json';
fs.writeFileSync(outputFile, JSON.stringify(convertedData, null, 2));

console.log();
console.log(`✅ SUCCESS! Converted ${Object.keys(convertedData).length} zones`);
console.log(`📁 Saved to: ${outputFile}`);
console.log(`🎮 Total rooms across all zones: ${totalRooms}`);

// Print summary
console.log();
console.log("📊 ZONE SUMMARY (Top 10 by room count):");
console.log("=".repeat(60));

const sorted = Object.entries(convertedData)
    .sort((a, b) => b[1].totalRooms - a[1].totalRooms)
    .slice(0, 10);

for (const [zoneName, zoneData] of sorted) {
    const padding = '.'.repeat(Math.max(1, 40 - zoneName.length));
    console.log(`  ${zoneName}${padding} ${zoneData.totalRooms.toString().padStart(4)} rooms`);
}

console.log();
console.log("=".repeat(60));
console.log("🗺️  READY TO USE IN REACT APP!");
console.log("=".repeat(60));

