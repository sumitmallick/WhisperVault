from PIL import Image, ImageDraw, ImageFont
import textwrap
import os
from ..config import settings


def ensure_assets_dir() -> str:
    os.makedirs(settings.assets_dir, exist_ok=True)
    return settings.assets_dir


def render_confession_image(content: str, filename: str) -> str:
    ensure_assets_dir()

    W, H = 1080, 1080
    bg_color = (20, 20, 20)
    text_color = (240, 240, 240)
    banner_color = (34, 197, 94)  # green

    img = Image.new("RGB", (W, H), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Fonts
    try:
        font_title = ImageFont.truetype("Arial.ttf", 48)
        font_body = ImageFont.truetype("Arial.ttf", 36)
    except Exception:
        font_title = ImageFont.load_default()
        font_body = ImageFont.load_default()

    # Banner
    draw.rectangle([0, 0, W, 120], fill=banner_color)
    draw.text((40, 35), "Confessions", font=font_title, fill=(0, 0, 0))

    # Content wrapping
    margin_x = 50
    y = 160
    max_width_px = W - margin_x * 2

    # Estimate characters per line using font metrics
    sample = "M" * 40
    sample_w, _ = draw.textbbox((0, 0), sample, font=font_body)[2:4]
    approx_chars_per_line = max(20, int(40 * max_width_px / max(sample_w, 1)))

    for paragraph in content.split("\n"):
        lines = textwrap.wrap(paragraph, width=approx_chars_per_line)
        if not lines:
            y += 16
        for line in lines:
            draw.text((margin_x, y), line, font=font_body, fill=text_color)
            _, _, tw, th = draw.textbbox((margin_x, y), line, font=font_body)
            y += th + 8
            if y > H - 40:
                break
        if y > H - 40:
            break
        y += 8

    out_path = os.path.join(settings.assets_dir, filename)
    img.save(out_path, format="PNG")
    return out_path
