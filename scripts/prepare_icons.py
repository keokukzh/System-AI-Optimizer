#!/usr/bin/env python3
"""
Icon preparation script for OptiAI
Converts thumbnail.jpg to various icon formats and sizes
"""

import os
import sys
from PIL import Image
import argparse

def convert_thumbnail_to_icons():
    """Convert thumbnail.jpg to various icon formats"""
    
    # Check if thumbnail.jpg exists
    thumbnail_path = "LOGOS/thumbnail.jpg"
    if not os.path.exists(thumbnail_path):
        print(f"Error: {thumbnail_path} not found!")
        return False
    
    try:
        # Load the thumbnail image
        img = Image.open(thumbnail_path)
        print(f"Loaded thumbnail: {img.size[0]}x{img.size[1]}")
        
        # Create icons directory if it doesn't exist
        icons_dir = "src-tauri/icons"
        os.makedirs(icons_dir, exist_ok=True)
        
        # Create ICO file with multiple sizes
        ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        ico_images = []
        
        for size in ico_sizes:
            resized = img.resize(size, Image.LANCZOS)
            ico_images.append(resized)
            print(f"Created {size[0]}x{size[1]} icon")
        
        # Save ICO file
        ico_path = os.path.join(icons_dir, "thumbnail.ico")
        ico_images[0].save(ico_path, format='ICO', sizes=ico_sizes)
        print(f"Saved ICO file: {ico_path}")
        
        # Create PNG versions for different sizes
        png_sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
        
        for size in png_sizes:
            resized = img.resize((size, size), Image.LANCZOS)
            png_path = os.path.join(icons_dir, f"thumbnail_{size}x{size}.png")
            resized.save(png_path, format='PNG')
            print(f"Saved PNG: {png_path}")
        
        # Create standard icon files for Tauri
        standard_sizes = [
            (16, "16x16.png"),
            (32, "32x32.png"), 
            (128, "128x128.png"),
            (256, "256x256.png"),
            (512, "512x512.png"),
            (1024, "1024x1024.png")
        ]
        
        for size, filename in standard_sizes:
            resized = img.resize((size, size), Image.LANCZOS)
            icon_path = os.path.join(icons_dir, filename)
            resized.save(icon_path, format='PNG')
            print(f"Saved standard icon: {icon_path}")
        
        # Create icon.ico and icon.png for Tauri
        icon_ico_path = os.path.join(icons_dir, "icon.ico")
        ico_images[0].save(icon_ico_path, format='ICO', sizes=ico_sizes)
        print(f"Saved icon.ico: {icon_ico_path}")
        
        icon_png_path = os.path.join(icons_dir, "icon.png")
        img_256 = img.resize((256, 256), Image.LANCZOS)
        img_256.save(icon_png_path, format='PNG')
        print(f"Saved icon.png: {icon_png_path}")
        
        # Create macOS icon (ICNS would require additional tools)
        # For now, just create a large PNG
        macos_icon_path = os.path.join(icons_dir, "icon.icns")
        img_1024 = img.resize((1024, 1024), Image.LANCZOS)
        img_1024.save(macos_icon_path.replace('.icns', '.png'), format='PNG')
        print(f"Created macOS icon placeholder: {macos_icon_path.replace('.icns', '.png')}")
        
        print("\n✅ Icon conversion completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error during icon conversion: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Convert thumbnail.jpg to various icon formats')
    parser.add_argument('--check-only', action='store_true', help='Only check if thumbnail exists')
    
    args = parser.parse_args()
    
    if args.check_only:
        if os.path.exists("LOGOS/thumbnail.jpg"):
            print("✅ thumbnail.jpg found")
            return 0
        else:
            print("❌ thumbnail.jpg not found")
            return 1
    
    # Change to project root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    os.chdir(project_root)
    
    print(f"Working directory: {os.getcwd()}")
    print("Converting thumbnail.jpg to icons...")
    
    if convert_thumbnail_to_icons():
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())
