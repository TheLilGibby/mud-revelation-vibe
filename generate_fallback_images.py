"""
Fallback generator - creates placeholder images without requiring PIL
This creates simple colored squares based on mob level as a temporary solution
"""
import json
import os
import base64
import struct

def create_simple_png(width, height, color):
    """Create a simple PNG image without PIL - just raw PNG data"""
    
    def png_pack(tag, data):
        chunk_head = tag + data
        return (struct.pack("!I", len(data)) +
                chunk_head +
                struct.pack("!I", 0xFFFFFFFF & zlib.crc32(chunk_head)))
    
    import zlib
    
    # Create pixel data
    raw_data = b""
    for y in range(height):
        raw_data += b'\x00'  # No filter
        for x in range(width):
            raw_data += bytes([color[0], color[1], color[2], 255])  # RGBA
    
    compressed = zlib.compress(raw_data, 9)
    
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    png += png_pack(b'IHDR', struct.pack("!2I5B", width, height, 8, 6, 0, 0, 0))
    
    # IDAT chunk
    png += png_pack(b'IDAT', compressed)
    
    # IEND chunk
    png += png_pack(b'IEND', b'')
    
    return png

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

print("\n" + "="*70)
print("GENERATING MOB PLACEHOLDER IMAGES (No PIL Required)")
print("="*70 + "\n")

# Load mobs
print("Loading mobs data...")
with open('GameData/Mobs.json', 'r', encoding='utf-8') as f:
    mobs = json.load(f)

print(f"Found {len(mobs)} mobs\n")

# Create directory
output_dir = 'public/images/mobs'
os.makedirs(output_dir, exist_ok=True)
print(f"Output directory: {output_dir}\n")

# Generate simple placeholder images
print("Generating placeholder images (colored squares)...")
print("NOTE: Install Pillow for full pixel art! Run: py -m pip install Pillow\n")

for i, mob in enumerate(mobs):
    color = get_mob_color(mob)
    png_data = create_simple_png(32, 32, color)
    
    filepath = os.path.join(output_dir, f"{mob['Id']}.png")
    with open(filepath, 'wb') as f:
        f.write(png_data)
    
    if (i + 1) % 100 == 0:
        print(f"  {i + 1}/{len(mobs)} images generated...")

print(f"\n✓ Complete! Generated {len(mobs)} placeholder images")
print(f"  - {sum(1 for m in mobs if m.get('IsBoss'))} boss mobs (crimson)")
print(f"  - {len(mobs) - sum(1 for m in mobs if m.get('IsBoss'))} regular mobs (level colors)")
print(f"\n📁 Location: {output_dir}")
print("\n" + "="*70)
print("TEMPORARY SOLUTION READY!")
print("="*70)
print("\nThese are simple colored squares.")
print("To get proper pixel art, fix your Python installation:")
print("  1. Run: py -m pip install Pillow")
print("  2. Then run: python generate_mob_pixel_art.py")
print("\n")

