"""
Generate a single sprite sheet containing all mob pixel art.
This dramatically improves performance by reducing 1046 HTTP requests to just 1.
"""

import json
import os
import math
from PIL import Image, ImageDraw
import hashlib

def get_mob_color(mob):
    """Determine color based on mob characteristics."""
    
    # Boss mobs - dark red/purple
    if mob.get('IsBoss', False):
        return (180, 20, 60)  # Crimson
    
    # Level-based colors
    level = mob.get('Level', 1)
    
    if level >= 100:
        return (138, 43, 226)  # Purple - High level
    elif level >= 75:
        return (255, 69, 0)    # Red-Orange - Very high
    elif level >= 50:
        return (255, 140, 0)   # Dark Orange - High
    elif level >= 25:
        return (255, 215, 0)   # Gold - Medium
    elif level >= 10:
        return (50, 205, 50)   # Lime Green - Low-Medium
    else:
        return (100, 149, 237) # Cornflower Blue - Low level
    
def generate_pixel_art(mob, size=32):
    """Generate a simple pixel art sprite for a mob."""
    
    # Create image with transparency
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Get mob color
    base_color = get_mob_color(mob)
    
    # Create variations for shading
    highlight = tuple(min(255, c + 40) for c in base_color)
    shadow = tuple(max(0, c - 40) for c in base_color)
    
    is_boss = mob.get('IsBoss', False)
    level = mob.get('Level', 1)
    
    # Use mob name hash for consistent variations
    name_hash = int(hashlib.md5(mob['Name'].encode()).hexdigest()[:8], 16)
    variant = name_hash % 5  # 5 different variants
    
    if is_boss:
        # Bosses - larger, more imposing
        # Body
        draw.rectangle([10, 14, 22, 28], fill=base_color)
        # Head
        draw.ellipse([11, 8, 21, 18], fill=base_color)
        # Eyes (red glow)
        draw.rectangle([13, 11, 14, 12], fill=(255, 0, 0))
        draw.rectangle([18, 11, 19, 12], fill=(255, 0, 0))
        # Arms
        draw.rectangle([8, 16, 10, 24], fill=shadow)
        draw.rectangle([22, 16, 24, 24], fill=shadow)
        # Crown/horns
        draw.rectangle([12, 6, 13, 8], fill=(255, 215, 0))
        draw.rectangle([19, 6, 20, 8], fill=(255, 215, 0))
        # Aura/outline
        draw.rectangle([9, 13, 10, 29], fill=highlight)
        draw.rectangle([22, 13, 23, 29], fill=highlight)
        
    elif variant == 0:
        # Humanoid style
        # Body
        draw.rectangle([12, 16, 20, 26], fill=base_color)
        # Head
        draw.ellipse([13, 10, 19, 16], fill=highlight)
        # Eyes
        draw.point((14, 12), fill=(0, 0, 0))
        draw.point((17, 12), fill=(0, 0, 0))
        # Arms
        draw.rectangle([10, 18, 12, 24], fill=shadow)
        draw.rectangle([20, 18, 22, 24], fill=shadow)
        # Legs
        draw.rectangle([13, 26, 15, 30], fill=shadow)
        draw.rectangle([17, 26, 19, 30], fill=shadow)
        
    elif variant == 1:
        # Beast/quadruped style
        # Body
        draw.ellipse([10, 14, 22, 24], fill=base_color)
        # Head
        draw.ellipse([18, 10, 26, 18], fill=highlight)
        # Ears
        draw.rectangle([20, 8, 21, 10], fill=base_color)
        draw.rectangle([23, 8, 24, 10], fill=base_color)
        # Legs
        draw.rectangle([11, 24, 13, 28], fill=shadow)
        draw.rectangle([14, 24, 16, 28], fill=shadow)
        draw.rectangle([17, 24, 19, 28], fill=shadow)
        draw.rectangle([20, 24, 22, 28], fill=shadow)
        
    elif variant == 2:
        # Flying creature
        # Body (small)
        draw.ellipse([14, 16, 18, 22], fill=base_color)
        # Head
        draw.ellipse([14, 12, 18, 16], fill=highlight)
        # Wings
        draw.polygon([(10, 18), (14, 16), (14, 22)], fill=shadow)
        draw.polygon([(22, 18), (18, 16), (18, 22)], fill=shadow)
        # Eyes
        draw.point((15, 14), fill=(255, 255, 0))
        draw.point((17, 14), fill=(255, 255, 0))
        
    elif variant == 3:
        # Blob/slime style
        # Main body
        draw.ellipse([10, 14, 22, 28], fill=base_color)
        # Highlight
        draw.ellipse([13, 16, 17, 20], fill=highlight)
        # Eyes
        draw.ellipse([12, 19, 14, 21], fill=(0, 0, 0))
        draw.ellipse([18, 19, 20, 21], fill=(0, 0, 0))
        # Mouth
        draw.arc([13, 21, 19, 25], 0, 180, fill=(0, 0, 0))
        
    else:  # variant == 4
        # Undead/skeletal
        # Skull
        draw.ellipse([12, 10, 20, 18], fill=(240, 240, 240))
        # Eye sockets
        draw.ellipse([13, 12, 15, 14], fill=(0, 0, 0))
        draw.ellipse([17, 12, 19, 14], fill=(0, 0, 0))
        # Glowing eyes
        draw.point((14, 13), fill=base_color)
        draw.point((18, 13), fill=base_color)
        # Spine/body
        draw.rectangle([14, 18, 18, 28], fill=(200, 200, 200))
        # Ribs
        for i in range(20, 26, 2):
            draw.line([(13, i), (19, i)], fill=(180, 180, 180))
    
    return img

def main():
    """Generate a single sprite sheet containing all mob pixel art."""
    
    # Load mobs data
    print("Loading mobs data...")
    with open('GameData/Mobs.json', 'r', encoding='utf-8') as f:
        mobs = json.load(f)
    
    num_mobs = len(mobs)
    sprite_size = 32  # Each sprite is 32x32 pixels
    
    # Calculate grid dimensions (try to make it roughly square)
    cols = math.ceil(math.sqrt(num_mobs))
    rows = math.ceil(num_mobs / cols)
    
    print(f"Creating sprite sheet for {num_mobs} mobs...")
    print(f"Grid: {cols} columns x {rows} rows")
    print(f"Sprite size: {sprite_size}x{sprite_size} pixels")
    
    # Create the sprite sheet image
    sheet_width = cols * sprite_size
    sheet_height = rows * sprite_size
    sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    print(f"Sprite sheet dimensions: {sheet_width}x{sheet_height} pixels")
    
    # Create mapping data
    sprite_map = {}
    
    # Generate and place each mob sprite
    for i, mob in enumerate(mobs):
        mob_id = mob['Id']
        
        # Calculate position in grid
        col = i % cols
        row = i // cols
        x = col * sprite_size
        y = row * sprite_size
        
        # Generate the pixel art
        sprite = generate_pixel_art(mob, sprite_size)
        
        # Paste onto sprite sheet
        sprite_sheet.paste(sprite, (x, y), sprite)
        
        # Store mapping (mob ID -> position)
        sprite_map[str(mob_id)] = {
            "x": x,
            "y": y,
            "width": sprite_size,
            "height": sprite_size,
            "col": col,
            "row": row
        }
        
        # Progress indicator
        if (i + 1) % 100 == 0:
            print(f"  Processed {i + 1}/{num_mobs} sprites...")
    
    # Save sprite sheet
    output_dir = 'public/images'
    os.makedirs(output_dir, exist_ok=True)
    
    sprite_sheet_path = os.path.join(output_dir, 'mob-spritesheet.png')
    sprite_sheet.save(sprite_sheet_path, 'PNG', optimize=True)
    
    print(f"\n✅ Sprite sheet saved: {sprite_sheet_path}")
    print(f"   File size: {os.path.getsize(sprite_sheet_path) / 1024:.1f} KB")
    
    # Save sprite mapping
    map_path = os.path.join(output_dir, 'mob-spritesheet.json')
    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump({
            "spriteSize": sprite_size,
            "cols": cols,
            "rows": rows,
            "sheetWidth": sheet_width,
            "sheetHeight": sheet_height,
            "totalMobs": num_mobs,
            "sprites": sprite_map
        }, f, indent=2)
    
    print(f"✅ Sprite mapping saved: {map_path}")
    
    # Calculate performance improvement
    old_requests = num_mobs
    new_requests = 2  # 1 sprite sheet + 1 JSON map
    reduction = ((old_requests - new_requests) / old_requests) * 100
    
    print(f"\n🚀 Performance Improvement:")
    print(f"   Before: {old_requests} HTTP requests")
    print(f"   After: {new_requests} HTTP requests")
    print(f"   Reduction: {reduction:.1f}%")
    print(f"\n✨ Sprite sheet generation complete!")

if __name__ == '__main__':
    main()

