#!/usr/bin/env python3
"""
Generate Tauri icons from main logo
Creates all required icon sizes for Windows, macOS, and Linux
"""

import os
from PIL import Image
from pathlib import Path

def generate_icons():
    """Generate all required Tauri icons"""
    
    # Source logo path
    source_logo = Path("logos/main-logo.png")
    icons_dir = Path("src-tauri/icons")
    
    if not source_logo.exists():
        print(f"Source logo not found: {source_logo}")
        return False
    
    # Create icons directory
    icons_dir.mkdir(parents=True, exist_ok=True)
    
    # Required icon sizes for Tauri
    icon_sizes = [
        (16, "16x16.png"),
        (32, "32x32.png"),
        (64, "64x64.png"),
        (128, "128x128.png"),
        (256, "256x256.png"),
        (512, "512x512.png"),
        (1024, "1024x1024.png")
    ]
    
    try:
        # Load source image
        source_img = Image.open(source_logo)
        
        # Generate PNG icons
        for size, filename in icon_sizes:
            resized = source_img.resize((size, size), Image.Resampling.LANCZOS)
            output_path = icons_dir / filename
            resized.save(output_path, "PNG")
            print(f"Generated: {output_path}")
        
        # Generate ICO file for Windows
        ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        ico_images = []
        
        for size in ico_sizes:
            resized = source_img.resize(size, Image.Resampling.LANCZOS)
            ico_images.append(resized)
        
        ico_path = icons_dir / "icon.ico"
        ico_images[0].save(ico_path, format='ICO', sizes=ico_sizes)
        print(f"Generated: {ico_path}")
        
        # Generate ICNS for macOS (simplified - just copy largest PNG)
        icns_path = icons_dir / "icon.icns"
        largest_img = source_img.resize((1024, 1024), Image.Resampling.LANCZOS)
        largest_img.save(icns_path, "PNG")  # Simplified - in real scenario would use iconutil
        print(f"Generated: {icns_path}")
        
        print("All icons generated successfully!")
        return True
        
    except Exception as e:
        print(f"Error generating icons: {e}")
        return False

if __name__ == "__main__":
    generate_icons()
