"""
Image generation service for converting confessions to branded social media images
Supports multiple platforms with custom templates and branding
"""

import os
import textwrap
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from PIL.ImageFilter import GaussianBlur
import io
import base64

# Platform specifications
PLATFORM_SPECS = {
    "facebook": {"width": 1200, "height": 630, "max_chars": 2000},
    "instagram": {"width": 1080, "height": 1080, "max_chars": 2200},
    "twitter": {"width": 1200, "height": 675, "max_chars": 280},
    "linkedin": {"width": 1200, "height": 627, "max_chars": 1300}
}

# Color themes
COLOR_THEMES = {
    "dark": {
        "background": "#1a1a1a",
        "text": "#ffffff",
        "accent": "#6366f1",
        "secondary": "#94a3b8"
    },
    "light": {
        "background": "#ffffff", 
        "text": "#1a1a1a",
        "accent": "#6366f1",
        "secondary": "#64748b"
    },
    "gradient": {
        "background": ["#667eea", "#764ba2"],
        "text": "#ffffff",
        "accent": "#fbbf24",
        "secondary": "#f3f4f6"
    }
}


class ConfessionImageGenerator:
    def __init__(self, assets_dir: str = "assets"):
        self.assets_dir = Path(assets_dir)
        self.assets_dir.mkdir(exist_ok=True)
        self.fonts_dir = self.assets_dir / "fonts"
        self.templates_dir = self.assets_dir / "templates"
        self.output_dir = self.assets_dir / "generated"
        
        # Create directories
        self.fonts_dir.mkdir(exist_ok=True)
        self.templates_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)
        
        self._load_fonts()

    def _load_fonts(self):
        """Load fonts for text rendering"""
        self.fonts = {}
        
        # Try to load custom fonts, fallback to default
        font_paths = {
            "title": self.fonts_dir / "Inter-Bold.ttf",
            "body": self.fonts_dir / "Inter-Regular.ttf",
            "caption": self.fonts_dir / "Inter-Light.ttf"
        }
        
        for font_type, font_path in font_paths.items():
            try:
                if font_path.exists():
                    self.fonts[font_type] = str(font_path)
                else:
                    # Use default system font
                    self.fonts[font_type] = None
            except Exception:
                self.fonts[font_type] = None

    def create_confession_image(
        self,
        confession_id: int,
        content: str,
        platform: str = "instagram",
        theme: str = "dark",
        user_demographics: Dict = None,
        branding: Dict = None
    ) -> Dict[str, str]:
        """
        Generate a branded confession image for social media
        
        Args:
            confession_id: Unique confession ID
            content: The confession text content
            platform: Target social media platform
            theme: Color theme (dark, light, gradient)
            user_demographics: User gender and age for context
            branding: Custom branding options
            
        Returns:
            Dictionary with image path, base64 data, and metadata
        """
        try:
            # Get platform specifications
            spec = PLATFORM_SPECS.get(platform, PLATFORM_SPECS["instagram"])
            
            # Create base image
            img = Image.new("RGB", (spec["width"], spec["height"]), color="#ffffff")
            
            # Apply background
            img = self._apply_background(img, theme, spec)
            
            # Add branding header
            img = self._add_branding_header(img, spec, theme, branding)
            
            # Add confession content
            img = self._add_confession_content(img, content, spec, theme, user_demographics)
            
            # Add footer with platform branding
            img = self._add_platform_footer(img, spec, theme, confession_id)
            
            # Save image
            output_path = self.output_dir / f"confession_{confession_id}_{platform}.png"
            img.save(output_path, "PNG", quality=95)
            
            # Convert to base64 for API response
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            return {
                "image_path": str(output_path),
                "image_base64": img_base64,
                "platform": platform,
                "dimensions": f"{spec['width']}x{spec['height']}",
                "theme": theme,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Failed to generate confession image: {str(e)}")

    def _apply_background(self, img: Image.Image, theme: str, spec: Dict) -> Image.Image:
        """Apply background color or gradient"""
        draw = ImageDraw.Draw(img)
        colors = COLOR_THEMES.get(theme, COLOR_THEMES["dark"])
        
        if theme == "gradient" and isinstance(colors["background"], list):
            # Create gradient background
            for i in range(spec["height"]):
                ratio = i / spec["height"]
                # Simple linear gradient between two colors
                start_color = self._hex_to_rgb(colors["background"][0])
                end_color = self._hex_to_rgb(colors["background"][1])
                
                current_color = tuple(
                    int(start_color[j] + (end_color[j] - start_color[j]) * ratio)
                    for j in range(3)
                )
                
                draw.line([(0, i), (spec["width"], i)], fill=current_color)
        else:
            # Solid background
            bg_color = colors["background"] if isinstance(colors["background"], str) else colors["background"][0]
            draw.rectangle([(0, 0), (spec["width"], spec["height"])], fill=bg_color)
        
        return img

    def _add_branding_header(self, img: Image.Image, spec: Dict, theme: str, branding: Dict = None) -> Image.Image:
        """Add WhisperVault branding header"""
        draw = ImageDraw.Draw(img)
        colors = COLOR_THEMES.get(theme, COLOR_THEMES["dark"])
        
        # Header height
        header_height = int(spec["height"] * 0.12)
        
        # Draw header background with slight transparency
        header_color = colors.get("accent", "#6366f1")
        draw.rectangle([(0, 0), (spec["width"], header_height)], fill=header_color)
        
        # Add logo/brand text
        try:
            font = ImageFont.truetype(self.fonts["title"], size=36) if self.fonts["title"] else ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        
        brand_text = branding.get("name", "WhisperVault") if branding else "WhisperVault"
        tagline = branding.get("tagline", "Anonymous Confessions") if branding else "Anonymous Confessions"
        
        # Brand name
        text_bbox = draw.textbbox((0, 0), brand_text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_x = (spec["width"] - text_width) // 2
        text_y = header_height // 4
        
        draw.text((text_x, text_y), brand_text, fill=colors["text"], font=font)
        
        # Tagline
        try:
            tagline_font = ImageFont.truetype(self.fonts["caption"], size=18) if self.fonts["caption"] else ImageFont.load_default()
        except:
            tagline_font = ImageFont.load_default()
        
        tagline_bbox = draw.textbbox((0, 0), tagline, font=tagline_font)
        tagline_width = tagline_bbox[2] - tagline_bbox[0]
        tagline_x = (spec["width"] - tagline_width) // 2
        tagline_y = text_y + 45
        
        draw.text((tagline_x, tagline_y), tagline, fill=colors["secondary"], font=tagline_font)
        
        return img

    def _add_confession_content(
        self, 
        img: Image.Image, 
        content: str, 
        spec: Dict, 
        theme: str, 
        demographics: Dict = None
    ) -> Image.Image:
        """Add the main confession content"""
        draw = ImageDraw.Draw(img)
        colors = COLOR_THEMES.get(theme, COLOR_THEMES["dark"])
        
        # Content area dimensions
        header_height = int(spec["height"] * 0.12)
        footer_height = int(spec["height"] * 0.15)
        content_height = spec["height"] - header_height - footer_height
        
        # Margins
        margin_x = int(spec["width"] * 0.08)
        margin_y = int(content_height * 0.1)
        
        content_area = {
            "x": margin_x,
            "y": header_height + margin_y,
            "width": spec["width"] - (2 * margin_x),
            "height": content_height - (2 * margin_y)
        }
        
        # Truncate content if too long
        max_chars = spec.get("max_chars", 2000)
        if len(content) > max_chars:
            content = content[:max_chars - 3] + "..."
        
        # Font for content
        try:
            content_font = ImageFont.truetype(self.fonts["body"], size=28) if self.fonts["body"] else ImageFont.load_default()
        except:
            content_font = ImageFont.load_default()
        
        # Word wrap text
        wrapped_lines = self._wrap_text(content, content_font, content_area["width"], draw)
        
        # Calculate line height and total text height
        line_height = 40
        total_text_height = len(wrapped_lines) * line_height
        
        # Center text vertically if it fits
        start_y = content_area["y"]
        if total_text_height < content_area["height"]:
            start_y = content_area["y"] + (content_area["height"] - total_text_height) // 2
        
        # Draw each line
        current_y = start_y
        for line in wrapped_lines:
            if current_y + line_height > content_area["y"] + content_area["height"]:
                break  # Stop if we run out of space
            
            # Center line horizontally
            line_bbox = draw.textbbox((0, 0), line, font=content_font)
            line_width = line_bbox[2] - line_bbox[0]
            line_x = content_area["x"] + (content_area["width"] - line_width) // 2
            
            draw.text((line_x, current_y), line, fill=colors["text"], font=content_font)
            current_y += line_height
        
        # Add demographics if provided
        if demographics:
            demo_text = f"Age: {demographics.get('age', 'N/A')} • Gender: {demographics.get('gender', 'N/A')}"
            try:
                demo_font = ImageFont.truetype(self.fonts["caption"], size=16) if self.fonts["caption"] else ImageFont.load_default()
            except:
                demo_font = ImageFont.load_default()
            
            demo_bbox = draw.textbbox((0, 0), demo_text, font=demo_font)
            demo_width = demo_bbox[2] - demo_bbox[0]
            demo_x = (spec["width"] - demo_width) // 2
            demo_y = current_y + 30
            
            draw.text((demo_x, demo_y), demo_text, fill=colors["secondary"], font=demo_font)
        
        return img

    def _add_platform_footer(self, img: Image.Image, spec: Dict, theme: str, confession_id: int) -> Image.Image:
        """Add footer with platform information"""
        draw = ImageDraw.Draw(img)
        colors = COLOR_THEMES.get(theme, COLOR_THEMES["dark"])
        
        footer_height = int(spec["height"] * 0.15)
        footer_y = spec["height"] - footer_height
        
        # Footer background
        footer_color = self._adjust_color_brightness(colors.get("accent", "#6366f1"), -20)
        draw.rectangle([(0, footer_y), (spec["width"], spec["height"])], fill=footer_color)
        
        # Footer text
        try:
            footer_font = ImageFont.truetype(self.fonts["caption"], size=16) if self.fonts["caption"] else ImageFont.load_default()
        except:
            footer_font = ImageFont.load_default()
        
        footer_text = f"whispervault.com • Anonymous Confessions • #{confession_id:06d}"
        
        footer_bbox = draw.textbbox((0, 0), footer_text, font=footer_font)
        footer_width = footer_bbox[2] - footer_bbox[0]
        footer_x = (spec["width"] - footer_width) // 2
        text_footer_y = footer_y + (footer_height - 20) // 2
        
        draw.text((footer_x, text_footer_y), footer_text, fill=colors["secondary"], font=footer_font)
        
        return img

    def _wrap_text(self, text: str, font: ImageFont.ImageFont, max_width: int, draw: ImageDraw.Draw) -> List[str]:
        """Wrap text to fit within specified width"""
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            width = bbox[2] - bbox[0]
            
            if width <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                    current_line = [word]
                else:
                    # Word is too long, break it
                    lines.append(word)
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines

    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def _adjust_color_brightness(self, hex_color: str, adjustment: int) -> str:
        """Adjust color brightness by specified amount"""
        rgb = self._hex_to_rgb(hex_color)
        adjusted = tuple(max(0, min(255, c + adjustment)) for c in rgb)
        return f"#{adjusted[0]:02x}{adjusted[1]:02x}{adjusted[2]:02x}"

    def create_multi_platform_images(
        self,
        confession_id: int,
        content: str,
        platforms: List[str],
        theme: str = "dark",
        demographics: Dict = None,
        branding: Dict = None
    ) -> Dict[str, Dict]:
        """Generate images for multiple platforms"""
        results = {}
        
        for platform in platforms:
            if platform in PLATFORM_SPECS:
                try:
                    result = self.create_confession_image(
                        confession_id,
                        content,
                        platform,
                        theme,
                        demographics,
                        branding
                    )
                    results[platform] = result
                except Exception as e:
                    results[platform] = {"error": str(e)}
        
        return results


# Global image generator instance
image_generator = ConfessionImageGenerator()


def generate_confession_image(
    confession_id: int,
    content: str,
    platforms: List[str] = ["instagram"],
    theme: str = "dark",
    demographics: Dict = None
) -> Dict[str, Dict]:
    """
    Public interface for generating confession images
    
    Args:
        confession_id: Unique confession identifier
        content: The confession text content
        platforms: List of target platforms
        theme: Visual theme for the image
        demographics: User demographics for context
        
    Returns:
        Dictionary mapping platforms to generated image data
    """
    return image_generator.create_multi_platform_images(
        confession_id,
        content,
        platforms,
        theme,
        demographics
    )