"""
Parse the ASCII World Map and convert it to detailed room layouts
This extracts location relationships and creates navigable room data
"""

import json
import re

def parse_ascii_map():
    """
    Parse WORLD_MAP_ASCII.txt to extract location relationships
    and create detailed room layouts
    """
    
    with open('WORLD_MAP_ASCII.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract regional connections from the ASCII map
    connections = {}
    
    # Parse the "REGIONAL CONNECTIONS" section
    sections = content.split('=' * 80)
    for section in sections:
        if 'REGIONAL CONNECTIONS' in section:
            parse_connections(section, connections)
        elif 'MAJOR TRAVEL ROUTES' in section:
            parse_routes(section, connections)
    
    return connections

def parse_connections(section, connections):
    """Parse the regional connections section"""
    lines = section.split('\n')
    current_region = None
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('='):
            continue
        
        if 'REGION' in line and '(' in line:
            # Extract region name
            region_name = line.split('(')[0].strip()
            current_region = region_name
            connections[current_region] = {
                'type': 'region',
                'connections': []
            }
        elif current_region and ('├──' in line or '└──' in line or '│' in line):
            # Extract direction and connected location
            if ':' in line:
                parts = line.split(':')
                direction = parts[0].replace('├──', '').replace('└──', '').strip()
                locations = parts[1].strip()
                
                connections[current_region]['connections'].append({
                    'direction': direction,
                    'locations': [loc.strip() for loc in locations.split(',')]
                })

def parse_routes(section, connections):
    """Parse major travel routes"""
    lines = section.split('\n')
    
    for line in lines:
        if '←→' in line:
            # Extract route between locations
            parts = line.split('←→')
            if len(parts) == 2:
                loc1 = parts[0].strip().split('.')[-1].strip()
                loc2 = parts[1].strip().split('(')[0].strip()
                
                # Store bidirectional route
                if 'routes' not in connections:
                    connections['routes'] = []
                
                connections['routes'].append({
                    'from': loc1,
                    'to': loc2,
                    'type': 'highway' if 'Highway' in line or 'Road' in line else 'path'
                })

def generate_detailed_rooms_from_ascii():
    """
    Generate detailed room layouts based on the ASCII map structure
    This creates actual room-by-room layouts for each location
    """
    
    # Load existing location data
    with open('GameData/Mobs.json', 'r', encoding='utf-8') as f:
        mobs_data = json.load(f)
    
    # Extract unique locations
    locations = {}
    for mob in mobs_data:
        if mob.get('Location'):
            locs = [l.strip() for l in mob['Location'].split(',')]
            for loc in locs:
                if loc and loc not in locations:
                    locations[loc] = {
                        'name': loc,
                        'mobs': [],
                        'mob_count': 0
                    }
                if loc:
                    locations[loc]['mobs'].append(mob['Name'])
                    locations[loc]['mob_count'] += 1
    
    # Parse ASCII map for connections
    connections = parse_ascii_map()
    
    # Generate room layouts for each location
    detailed_maps = {}
    
    for loc_name, loc_data in locations.items():
        detailed_maps[loc_name] = generate_rooms_for_location(
            loc_name, 
            loc_data, 
            connections
        )
    
    # Save to file
    with open('detailed_room_maps.json', 'w', encoding='utf-8') as f:
        json.dump(detailed_maps, f, indent=2)
    
    print(f"Generated detailed room maps for {len(detailed_maps)} locations!")
    print(f"Saved to: detailed_room_maps.json")
    
    return detailed_maps

def generate_rooms_for_location(location_name, location_data, connections):
    """
    Generate individual rooms for a specific location
    Based on mob count and location type
    """
    
    mob_count = location_data['mob_count']
    
    # Determine location type from name
    location_type = classify_location(location_name)
    
    # Calculate number of rooms based on mob count and type
    if 'City' in location_type or 'Town' in location_name:
        num_rooms = max(20, mob_count // 5)
        grid_size = (7, 7)
    elif 'Dungeon' in location_type or 'Catacomb' in location_name:
        num_rooms = max(10, mob_count // 8)
        grid_size = (5, 5)
    elif 'Forest' in location_type or location_name.endswith('Forest'):
        num_rooms = max(15, mob_count // 6)
        grid_size = (6, 6)
    else:
        num_rooms = max(12, mob_count // 7)
        grid_size = (5, 5)
    
    # Generate room data
    rooms = []
    room_id = 1
    
    for i in range(min(num_rooms, grid_size[0] * grid_size[1])):
        row = i // grid_size[1]
        col = i % grid_size[1]
        
        room = {
            'id': room_id,
            'name': f"{location_name} - Room {room_id}",
            'description': f"A room in {location_name}",
            'position': {'x': col, 'y': row},
            'exits': generate_exits(row, col, grid_size),
            'mobs': location_data['mobs'][:mob_count // num_rooms] if room_id == 1 else []
        }
        
        rooms.append(room)
        room_id += 1
    
    return {
        'location_name': location_name,
        'location_type': location_type,
        'grid_size': grid_size,
        'total_rooms': len(rooms),
        'total_mobs': mob_count,
        'rooms': rooms
    }

def generate_exits(row, col, grid_size):
    """Generate available exits for a room based on grid position"""
    exits = {}
    
    if row > 0:
        exits['north'] = True
    if row < grid_size[0] - 1:
        exits['south'] = True
    if col > 0:
        exits['west'] = True
    if col < grid_size[1] - 1:
        exits['east'] = True
    
    return exits

def classify_location(name):
    """Classify location type from name"""
    name_lower = name.lower()
    
    if any(word in name_lower for word in ['city', 'town', 'settlement']):
        return 'City'
    elif any(word in name_lower for word in ['dungeon', 'catacombs', 'crypt', 'depths', 'lair', 'sanctum']):
        return 'Dungeon'
    elif any(word in name_lower for word in ['forest', 'woods', 'grove']):
        return 'Forest'
    elif any(word in name_lower for word in ['mountain', 'peak', 'summit']):
        return 'Mountains'
    elif any(word in name_lower for word in ['swamp', 'marsh', 'bog']):
        return 'Swamp'
    elif any(word in name_lower for word in ['lake', 'river', 'falls', 'water']):
        return 'Water'
    elif any(word in name_lower for word in ['mine', 'mines', 'cavern', 'cave']):
        return 'Underground'
    elif any(word in name_lower for word in ['road', 'highway', 'path']):
        return 'Road'
    elif any(word in name_lower for word in ['ruins', 'temple', 'manor']):
        return 'Ruins'
    elif any(word in name_lower for word in ['realm', 'plane', 'ethereal', 'spirit', 'astral']):
        return 'Ethereal'
    else:
        return 'Other'

if __name__ == '__main__':
    print("Parsing ASCII World Map...")
    print("=" * 60)
    
    detailed_maps = generate_detailed_rooms_from_ascii()
    
    print("\n" + "=" * 60)
    print("Sample of generated data:")
    print("=" * 60)
    
    # Show sample
    for i, (loc_name, loc_data) in enumerate(list(detailed_maps.items())[:3]):
        print(f"\n{loc_name}:")
        print(f"  Type: {loc_data['location_type']}")
        print(f"  Grid: {loc_data['grid_size']}")
        print(f"  Rooms: {loc_data['total_rooms']}")
        print(f"  Mobs: {loc_data['total_mobs']}")

