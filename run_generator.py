"""Simple wrapper to run the mob pixel art generator with automatic dependency installation."""

import subprocess
import sys
import os

def main():
    print("=" * 70)
    print("MOB PIXEL ART GENERATOR")
    print("=" * 70)
    print()
    
    # Check if we're in the right directory
    if not os.path.exists('GameData/Mobs.json'):
        print("ERROR: GameData/Mobs.json not found!")
        print("Please run this script from the project root directory.")
        input("Press Enter to exit...")
        return
    
    # Try to import PIL
    print("Checking for Pillow library...")
    try:
        from PIL import Image
        print("✓ Pillow is installed!")
    except ImportError:
        print("✗ Pillow not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
        print("✓ Pillow installed successfully!")
    
    print()
    print("Starting generation...")
    print("-" * 70)
    print()
    
    # Import and run the generator
    import generate_mob_pixel_art
    generate_mob_pixel_art.main()
    
    print()
    print("=" * 70)
    print("COMPLETE!")
    print("=" * 70)
    print()
    print("Images saved to: public\\images\\mobs\\")
    print("Preview gallery: public\\images\\mobs\\preview.html")
    print()
    input("Press Enter to exit...")

if __name__ == '__main__':
    main()

