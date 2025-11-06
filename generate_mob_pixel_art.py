"""
Generate basic pixel art for all mobs in the game.
Creates 32x32 pixel art images based on mob characteristics.
"""

import json
import os
from PIL import Image, ImageDraw
import colorsys
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
    """Generate pixel art for all mobs."""
    
    # Load mobs data
    print("Loading mobs data...")
    with open('GameData/Mobs.json', 'r', encoding='utf-8') as f:
        mobs = json.load(f)
    
    # Create output directory
    output_dir = 'public/images/mobs'
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Generating pixel art for {len(mobs)} mobs...")
    
    # Generate images
    for i, mob in enumerate(mobs):
        mob_id = mob['Id']
        
        # Generate the pixel art
        img = generate_pixel_art(mob)
        
        # Save with mob ID as filename
        filename = f"{mob_id}.png"
        filepath = os.path.join(output_dir, filename)
        img.save(filepath, 'PNG')
        
        # Progress indicator
        if (i + 1) % 100 == 0:
            print(f"  Generated {i + 1}/{len(mobs)} images...")
    
    print(f"\nComplete! Generated {len(mobs)} mob pixel art images in '{output_dir}'")
    print(f"  - {sum(1 for m in mobs if m.get('IsBoss'))} boss mobs")
    print(f"  - {len(mobs) - sum(1 for m in mobs if m.get('IsBoss'))} regular mobs")
    
    # Create a reference HTML file to preview all mobs
    create_preview_html(mobs, output_dir)

def create_preview_html(mobs, output_dir):
    """Create an HTML preview file to see all mob pixel art."""
    
    html_content = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mob Pixel Art Preview</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #1a1a1a;
            color: #fff;
            padding: 20px;
        }
        h1 {
            text-align: center;
            color: #ffd700;
        }
        .filters {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: #2a2a2a;
            border-radius: 8px;
        }
        .filters label {
            margin: 0 10px;
        }
        .mob-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .mob-card {
            background: #2a2a2a;
            border: 2px solid #444;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
            transition: transform 0.2s, border-color 0.2s;
        }
        .mob-card:hover {
            transform: scale(1.05);
            border-color: #ffd700;
        }
        .mob-card.boss {
            border-color: #ff1493;
            background: #3a1a2a;
        }
        .mob-image {
            width: 64px;
            height: 64px;
            margin: 0 auto 8px;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
        }
        .mob-name {
            font-size: 11px;
            margin: 5px 0;
            min-height: 30px;
        }
        .mob-level {
            font-size: 10px;
            color: #ffd700;
        }
        .boss-badge {
            display: inline-block;
            background: #ff1493;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            margin-top: 3px;
        }
    </style>
</head>
<body>
    <h1>🎮 Revelation MUD - Mob Pixel Art Gallery 🎮</h1>
    
    <div class="filters">
        <label>
            <input type="checkbox" id="showBosses" checked> Show Bosses
        </label>
        <label>
            <input type="checkbox" id="showRegular" checked> Show Regular Mobs
        </label>
        <label>
            Min Level: <input type="number" id="minLevel" value="1" min="1" max="200" style="width: 60px;">
        </label>
        <label>
            Max Level: <input type="number" id="maxLevel" value="200" min="1" max="200" style="width: 60px;">
        </label>
        <button onclick="applyFilters()" style="margin-left: 10px; padding: 5px 15px;">Apply Filters</button>
    </div>
    
    <div class="mob-grid" id="mobGrid">
"""
    
    # Add each mob
    for mob in mobs:
        is_boss = mob.get('IsBoss', False)
        boss_class = 'boss' if is_boss else ''
        boss_badge = '<div class="boss-badge">BOSS</div>' if is_boss else ''
        
        html_content += f"""
        <div class="mob-card {boss_class}" data-boss="{str(is_boss).lower()}" data-level="{mob['Level']}">
            <div class="mob-image">
                <img src="mobs/{mob['Id']}.png" alt="{mob['Name']}" style="width: 100%; image-rendering: pixelated;">
            </div>
            <div class="mob-name">{mob['Name']}</div>
            <div class="mob-level">Level {mob['Level']}</div>
            {boss_badge}
        </div>
"""
    
    html_content += """
    </div>
    
    <script>
        function applyFilters() {
            const showBosses = document.getElementById('showBosses').checked;
            const showRegular = document.getElementById('showRegular').checked;
            const minLevel = parseInt(document.getElementById('minLevel').value);
            const maxLevel = parseInt(document.getElementById('maxLevel').value);
            
            const cards = document.querySelectorAll('.mob-card');
            cards.forEach(card => {
                const isBoss = card.dataset.boss === 'true';
                const level = parseInt(card.dataset.level);
                
                const typeMatch = (isBoss && showBosses) || (!isBoss && showRegular);
                const levelMatch = level >= minLevel && level <= maxLevel;
                
                card.style.display = (typeMatch && levelMatch) ? 'block' : 'none';
            });
        }
        
        // Apply filters on page load
        applyFilters();
    </script>
</body>
</html>
"""
    
    preview_path = os.path.join(output_dir, 'preview.html')
    with open(preview_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"\nPreview HTML created: {preview_path}")
    print(f"Open this file in a browser to see all mob sprites!")

if __name__ == '__main__':
    main()

