"""Quick inline mob pixel art generator - no external imports needed first"""
import json
import os

# First check if PIL is available, if not, install it
try:
    from PIL import Image, ImageDraw
    print("✓ Pillow found, starting generation...")
except ImportError:
    print("Installing Pillow...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])
    print("✓ Pillow installed!")
    from PIL import Image, ImageDraw

import hashlib

def get_mob_color(mob):
    """Determine color based on mob characteristics."""
    if mob.get('IsBoss', False):
        return (180, 20, 60)  # Crimson
    
    level = mob.get('Level', 1)
    if level >= 100:
        return (138, 43, 226)  # Purple
    elif level >= 75:
        return (255, 69, 0)    # Red-Orange
    elif level >= 50:
        return (255, 140, 0)   # Dark Orange
    elif level >= 25:
        return (255, 215, 0)   # Gold
    elif level >= 10:
        return (50, 205, 50)   # Lime Green
    else:
        return (100, 149, 237) # Cornflower Blue

def generate_pixel_art(mob, size=32):
    """Generate a simple pixel art sprite for a mob."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    base_color = get_mob_color(mob)
    highlight = tuple(min(255, c + 40) for c in base_color)
    shadow = tuple(max(0, c - 40) for c in base_color)
    
    is_boss = mob.get('IsBoss', False)
    name_hash = int(hashlib.md5(mob['Name'].encode()).hexdigest()[:8], 16)
    variant = name_hash % 5
    
    if is_boss:
        # Boss style
        draw.rectangle([10, 14, 22, 28], fill=base_color)
        draw.ellipse([11, 8, 21, 18], fill=base_color)
        draw.rectangle([13, 11, 14, 12], fill=(255, 0, 0))
        draw.rectangle([18, 11, 19, 12], fill=(255, 0, 0))
        draw.rectangle([8, 16, 10, 24], fill=shadow)
        draw.rectangle([22, 16, 24, 24], fill=shadow)
        draw.rectangle([12, 6, 13, 8], fill=(255, 215, 0))
        draw.rectangle([19, 6, 20, 8], fill=(255, 215, 0))
        draw.rectangle([9, 13, 10, 29], fill=highlight)
        draw.rectangle([22, 13, 23, 29], fill=highlight)
    elif variant == 0:
        # Humanoid
        draw.rectangle([12, 16, 20, 26], fill=base_color)
        draw.ellipse([13, 10, 19, 16], fill=highlight)
        draw.point((14, 12), fill=(0, 0, 0))
        draw.point((17, 12), fill=(0, 0, 0))
        draw.rectangle([10, 18, 12, 24], fill=shadow)
        draw.rectangle([20, 18, 22, 24], fill=shadow)
        draw.rectangle([13, 26, 15, 30], fill=shadow)
        draw.rectangle([17, 26, 19, 30], fill=shadow)
    elif variant == 1:
        # Beast
        draw.ellipse([10, 14, 22, 24], fill=base_color)
        draw.ellipse([18, 10, 26, 18], fill=highlight)
        draw.rectangle([20, 8, 21, 10], fill=base_color)
        draw.rectangle([23, 8, 24, 10], fill=base_color)
        draw.rectangle([11, 24, 13, 28], fill=shadow)
        draw.rectangle([14, 24, 16, 28], fill=shadow)
        draw.rectangle([17, 24, 19, 28], fill=shadow)
        draw.rectangle([20, 24, 22, 28], fill=shadow)
    elif variant == 2:
        # Flying
        draw.ellipse([14, 16, 18, 22], fill=base_color)
        draw.ellipse([14, 12, 18, 16], fill=highlight)
        draw.polygon([(10, 18), (14, 16), (14, 22)], fill=shadow)
        draw.polygon([(22, 18), (18, 16), (18, 22)], fill=shadow)
        draw.point((15, 14), fill=(255, 255, 0))
        draw.point((17, 14), fill=(255, 255, 0))
    elif variant == 3:
        # Blob
        draw.ellipse([10, 14, 22, 28], fill=base_color)
        draw.ellipse([13, 16, 17, 20], fill=highlight)
        draw.ellipse([12, 19, 14, 21], fill=(0, 0, 0))
        draw.ellipse([18, 19, 20, 21], fill=(0, 0, 0))
        draw.arc([13, 21, 19, 25], 0, 180, fill=(0, 0, 0))
    else:
        # Undead
        draw.ellipse([12, 10, 20, 18], fill=(240, 240, 240))
        draw.ellipse([13, 12, 15, 14], fill=(0, 0, 0))
        draw.ellipse([17, 12, 19, 14], fill=(0, 0, 0))
        draw.point((14, 13), fill=base_color)
        draw.point((18, 13), fill=base_color)
        draw.rectangle([14, 18, 18, 28], fill=(200, 200, 200))
        for i in range(20, 26, 2):
            draw.line([(13, i), (19, i)], fill=(180, 180, 180))
    
    return img

# Main execution
print("\n" + "="*70)
print("GENERATING MOB PIXEL ART")
print("="*70 + "\n")

# Load mobs
print("Loading mobs data...")
with open('GameData/Mobs.json', 'r', encoding='utf-8') as f:
    mobs = json.load(f)

print(f"Found {len(mobs)} mobs to generate\n")

# Create directory
output_dir = 'public/images/mobs'
os.makedirs(output_dir, exist_ok=True)
print(f"Output directory: {output_dir}\n")

# Generate images
print("Generating pixel art...")
for i, mob in enumerate(mobs):
    img = generate_pixel_art(mob)
    filepath = os.path.join(output_dir, f"{mob['Id']}.png")
    img.save(filepath, 'PNG')
    
    if (i + 1) % 100 == 0:
        print(f"  {i + 1}/{len(mobs)} images generated...")

print(f"\n✓ Complete! Generated {len(mobs)} images")
print(f"  - {sum(1 for m in mobs if m.get('IsBoss'))} boss mobs")
print(f"  - {len(mobs) - sum(1 for m in mobs if m.get('IsBoss'))} regular mobs")
print(f"\n📁 Location: {output_dir}")
print("\n" + "="*70)
print("READY TO USE!")
print("="*70)
print("\nRun 'npm start' and check the Mobs page to see your pixel art!\n")

