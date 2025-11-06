"""
Import REAL room data from WorldData.json into the React app
This replaces procedural maps with actual MUD room layouts!
"""

import json

def convert_worlddata_to_react_format():
    """
    Convert WorldData.json (MUD format) to our React app format
    """
    
    print("Loading WorldData.json...")
    with open('GameData/WorldData.json', 'r', encoding='utf-8') as f:
        world_data = json.load(f)
    
    print(f"Found {len(world_data['Zones'])} zones!")
    
    # Convert to our format
    converted_data = {}
    
    for zone_key, zone_data in world_data['Zones'].items():
        zone_name = zone_data['ZoneName']
        
        print(f"Processing: {zone_name} ({zone_data['TotalRooms']} rooms)")
        
        # Convert rooms
        rooms = []
        for room_id, room_data in zone_data['Rooms'].items():
            room = {
                'id': room_data['RoomId'],
                'name': room_data['Name'],
                'description': room_data['Description'],
                'position': {
                    'x': room_data['X'],
                    'y': room_data['Y'],
                    'z': room_data['Z']
                },
                'exits': {
                    'north': room_data['ExitNorth'],
                    'south': room_data['ExitSouth'],
                    'east': room_data['ExitEast'],
                    'west': room_data['ExitWest'],
                    'up': room_data['ExitUp'],
                    'down': room_data['ExitDown']
                },
                'npcs': [npc['NpcName'] for npc in room_data.get('Npcs', [])],
                'terrainColor': room_data.get('TerrainColor', 'brown'),
                'isZoneExit': room_data.get('IsZoneExit', False),
                'exitToZone': room_data.get('ExitToZone', ''),
                'connectedRooms': room_data.get('ConnectedRooms', [])
            }
            rooms.append(room)
        
        converted_data[zone_name] = {
            'zoneName': zone_name,
            'fileKey': zone_key,
            'totalRooms': zone_data['TotalRooms'],
            'rooms': rooms
        }
    
    # Save to React-friendly format
    output_file = 'src/realWorldMaps.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(converted_data, f, indent=2)
    
    print(f"\n✅ SUCCESS! Converted {len(converted_data)} zones")
    print(f"📁 Saved to: {output_file}")
    print(f"🎮 Total rooms across all zones: {sum(z['totalRooms'] for z in converted_data.values())}")
    
    # Print summary
    print("\n📊 ZONE SUMMARY:")
    print("=" * 60)
    for zone_name, zone_data in sorted(converted_data.items(), key=lambda x: x[1]['totalRooms'], reverse=True)[:10]:
        print(f"  {zone_name:.<40} {zone_data['totalRooms']:>4} rooms")
    
    return converted_data

if __name__ == '__main__':
    print("=" * 60)
    print("  IMPORTING REAL MUD ROOM DATA")
    print("=" * 60)
    print()
    
    data = convert_worlddata_to_react_format()
    
    print("\n" + "=" * 60)
    print("🗺️  READY TO USE IN REACT APP!")
    print("=" * 60)

