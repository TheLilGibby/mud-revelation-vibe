"""
Build a navigable map with room connections from GameData
This script infers room connections and creates a grid-based navigation system
"""

import json
import re
from collections import defaultdict

def load_game_data():
    """Load the game data files"""
    with open('GameData/Mobs.json', 'r', encoding='utf-8') as f:
        mobs = json.load(f)
    
    return mobs

def extract_unique_locations(mobs):
    """Extract all unique location names"""
    locations = set()
    for mob in mobs:
        if mob.get('Location'):
            # Split comma-separated locations
            locs = [l.strip() for l in mob['Location'].split(',')]
            locations.update(locs)
    
    return sorted([loc for loc in locations if loc])

def infer_connections(locations):
    """
    Infer logical connections between locations based on naming patterns
    and geographical relationships
    """
    
    connections = defaultdict(lambda: {'north': None, 'south': None, 'east': None, 'west': None, 'up': None, 'down': None})
    
    # Group locations by region/area
    regions = defaultdict(list)
    
    for loc in locations:
        # Extract region name
        if 'Myronmet' in loc:
            regions['Myronmet'].append(loc)
        elif 'Epiach' in loc:
            regions['Epiach'].append(loc)
        elif 'Silverspire' in loc:
            regions['Silverspire'].append(loc)
        elif 'Illundium' in loc:
            regions['Illundium'].append(loc)
        elif 'Coranin' in loc:
            regions['Coranin'].append(loc)
        elif 'Atlaand' in loc:
            regions['Atlaand'].append(loc)
        elif 'Naraikos' in loc or 'Naraok' in loc:
            regions['Naraikos'].append(loc)
        elif 'Conosiat' in loc:
            regions['Conosiat'].append(loc)
        elif 'Vatlan' in loc:
            regions['Vatlan'].append(loc)
        elif 'Greeanjok' in loc:
            regions['Greeanjok'].append(loc)
        elif 'Majestia' in loc:
            regions['Majestia'].append(loc)
        else:
            regions['Special'].append(loc)
    
    # Infer connections based on naming patterns
    
    # Directional patterns
    directional_pairs = [
        ('Northern', 'Southern'),
        ('Eastern', 'Western'),
        ('North', 'South'),
        ('East', 'West'),
        ('Upper', 'Lower'),
    ]
    
    for loc1 in locations:
        for loc2 in locations:
            if loc1 == loc2:
                continue
            
            # Check for directional pairs
            for dir1, dir2 in directional_pairs:
                if dir1 in loc1 and loc2.replace(dir1, dir2) == loc1.replace(dir1, dir2):
                    if dir1 == 'Northern' or dir1 == 'North':
                        connections[loc1]['south'] = loc2
                        connections[loc2]['north'] = loc1
                    elif dir1 == 'Eastern' or dir1 == 'East':
                        connections[loc1]['west'] = loc2
                        connections[loc2]['east'] = loc1
            
            # Check for hierarchical locations (e.g., "City" to "City Undercity")
            if loc2.startswith(loc1) and loc2 != loc1:
                if 'Under' in loc2 or 'Depth' in loc2 or 'Catacomb' in loc2:
                    connections[loc1]['down'] = loc2
                    connections[loc2]['up'] = loc1
    
    # Define known major connections between regions
    major_connections = {
        'Myronmet': {
            'west': 'Atlaand',
            'north': 'Illundium Forest',
            'east': 'Vatlan Cliffs',
            'south': 'Lake Conosiat',
        },
        'Illundium Forest': {
            'south': 'Myronmet',
            'east': 'Epiach',
        },
        'Epiach': {
            'west': 'Illundium Forest',
            'north': 'Silverspire Foothills',
            'east': 'Coranin Forest',
        },
        'Silverspire Foothills': {
            'south': 'Epiach',
            'north': 'Silverspire Mountains',
        },
        'Silverspire Mountains': {
            'south': 'Silverspire Foothills',
            'east': 'Greeanjok',
        },
        'Atlaand': {
            'east': 'Myronmet',
            'south': 'Naraikos',
        },
        'Vatlan Cliffs': {
            'west': 'Myronmet',
        },
        'Lake Conosiat': {
            'north': 'Myronmet',
        },
    }
    
    # Add major connections
    for loc, dirs in major_connections.items():
        for direction, target in dirs.items():
            connections[loc][direction] = target
            # Add reverse connection
            reverse_dir = {'north': 'south', 'south': 'north', 'east': 'west', 'west': 'east'}.get(direction)
            if reverse_dir:
                connections[target][reverse_dir] = loc
    
    return dict(connections)

def analyze_location_hierarchy(locations):
    """
    Analyze location hierarchy (e.g., city -> district -> building)
    """
    hierarchy = defaultdict(list)
    
    for loc in locations:
        # Check for hierarchical naming
        if ',' in loc:
            continue  # Skip multi-location entries
        
        # Detect sub-locations
        for other_loc in locations:
            if other_loc == loc:
                continue
            if loc in other_loc and len(other_loc) > len(loc):
                hierarchy[loc].append(other_loc)
    
    return dict(hierarchy)

def create_grid_layout(locations, connections):
    """
    Create a grid-based layout for locations
    This assigns X,Y coordinates based on connections
    """
    
    layout = {}
    
    # Start with a central location
    start_loc = 'Myronmet' if 'Myronmet' in locations else locations[0]
    layout[start_loc] = (0, 0)
    
    # BFS to assign coordinates based on connections
    visited = {start_loc}
    queue = [start_loc]
    
    while queue:
        current = queue.pop(0)
        x, y = layout[current]
        
        # Check all directions
        if current in connections:
            conn = connections[current]
            
            if conn['north'] and conn['north'] not in visited:
                layout[conn['north']] = (x, y - 1)
                visited.add(conn['north'])
                queue.append(conn['north'])
            
            if conn['south'] and conn['south'] not in visited:
                layout[conn['south']] = (x, y + 1)
                visited.add(conn['south'])
                queue.append(conn['south'])
            
            if conn['east'] and conn['east'] not in visited:
                layout[conn['east']] = (x + 1, y)
                visited.add(conn['east'])
                queue.append(conn['east'])
            
            if conn['west'] and conn['west'] not in visited:
                layout[conn['west']] = (x - 1, y)
                visited.add(conn['west'])
                queue.append(conn['west'])
    
    # Assign coordinates to unconnected locations
    used_coords = set(layout.values())
    next_y = max([y for _, y in used_coords]) + 2 if used_coords else 0
    next_x = 0
    
    for loc in locations:
        if loc not in layout:
            while (next_x, next_y) in used_coords:
                next_x += 1
                if next_x > 10:
                    next_x = 0
                    next_y += 1
            layout[loc] = (next_x, next_y)
            next_x += 1
    
    return layout

def generate_navigation_map_data():
    """Generate complete navigation map data"""
    
    print("Loading game data...")
    mobs = load_game_data()
    
    print("Extracting locations...")
    locations = extract_unique_locations(mobs)
    print(f"Found {len(locations)} unique locations")
    
    print("Inferring connections...")
    connections = infer_connections(locations)
    
    print("Analyzing hierarchy...")
    hierarchy = analyze_location_hierarchy(locations)
    
    print("Creating grid layout...")
    grid_layout = create_grid_layout(locations, connections)
    
    # Count connections
    connected_count = sum(1 for loc in connections if any(connections[loc].values()))
    print(f"Connected {connected_count} locations with navigational data")
    
    # Build final data structure
    navigation_data = {
        'locations': {},
        'metadata': {
            'total_locations': len(locations),
            'connected_locations': connected_count,
            'regions': len(set([loc.split()[0] for loc in locations if loc])),
        }
    }
    
    for loc in locations:
        navigation_data['locations'][loc] = {
            'name': loc,
            'exits': connections.get(loc, {}),
            'grid_position': grid_layout.get(loc, (0, 0)),
            'sub_locations': hierarchy.get(loc, []),
        }
    
    # Save to file
    output_file = 'navigation_map_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(navigation_data, f, indent=2)
    
    print(f"\n✅ Navigation map data saved to: {output_file}")
    
    # Print summary
    print("\n📊 SUMMARY:")
    print(f"  Total Locations: {navigation_data['metadata']['total_locations']}")
    print(f"  Connected: {navigation_data['metadata']['connected_locations']}")
    
    print("\n🔗 Sample Connections:")
    for i, (loc, data) in enumerate(list(navigation_data['locations'].items())[:5]):
        if any(data['exits'].values()):
            print(f"\n  {loc}:")
            for direction, target in data['exits'].items():
                if target:
                    print(f"    {direction.upper()}: {target}")
    
    return navigation_data

if __name__ == '__main__':
    navigation_data = generate_navigation_map_data()

