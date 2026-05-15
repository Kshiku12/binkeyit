from PIL import Image, ImageDraw, ImageFont
import os

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\badges"
os.makedirs(base_dir, exist_ok=True)

def create_badge(filename, bg_color, text_lines, icon_char=""):
    img = Image.new('RGB', (400, 400), color=bg_color)
    d = ImageDraw.Draw(img)
    
    # Try to use a default font, otherwise fall back to basic
    try:
        font = ImageFont.truetype("arialbd.ttf", 40)
        icon_font = ImageFont.truetype("segoeuii.ttf", 80) # Using Segoe UI emoji/symbol if possible
    except:
        font = ImageFont.load_default()
        icon_font = font

    y_text = 150
    for line in text_lines:
        # getbbox returns (left, top, right, bottom)
        bbox = d.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        d.text(((400 - text_width) / 2, y_text), line, font=font, fill=(255, 255, 255))
        y_text += text_height + 10
        
    img.save(os.path.join(base_dir, filename))

# Quality Badge
create_badge("quality-badge.jpg", (12, 131, 31), ["100%", "GENUINE", "QUALITY"])

# Delivery Badge
create_badge("delivery-badge.jpg", (217, 119, 6), ["SUPERFAST", "DELIVERY", "GUARANTEED"])

print("Badges created.")
