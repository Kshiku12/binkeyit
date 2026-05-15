import os
import urllib.request
import urllib.parse
import re

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images"
categories_dir = os.path.join(base_dir, "categories")
products_dir = os.path.join(base_dir, "products")

os.makedirs(categories_dir, exist_ok=True)
os.makedirs(products_dir, exist_ok=True)

to_download = [
    # Categories
    ("categories", "poker-party.jpg", "Poker chips and playing cards banner high quality clean background"),
    ("categories", "gym-training.jpg", "Dumbbells and gym equipment banner clean background"),
    ("categories", "electronics.jpg", "Smartphones and headphones banner electronics clean background"),
    ("categories", "toys-games.jpg", "Kids toys and board games clean background"),
    ("categories", "beauty-care.jpg", "Cosmetics and beauty personal care products flatlay clean background"),
    ("categories", "stationery.jpg", "Office stationery pens notebooks clean background"),

    # Poker & Party
    ("products", "copag-cards.jpg", "Copag 100% Plastic Playing Cards Jumbo Index single pack front view white background"),
    ("products", "poker-chips-300.jpg", "300 Piece Poker Chip Set in aluminum case open view white background"),
    ("products", "dealer-button.jpg", "Casino Poker Dealer Button white puck white background"),
    ("products", "uno-cards.jpg", "Mattel UNO Card Game box front view white background"),
    ("products", "party-popper.jpg", "Party popper confetti cannon single front view white background"),

    # Gym & Training
    ("products", "dumbbell-5kg.jpg", "5kg Hex Dumbbell single black front view white background"),
    ("products", "on-whey-protein.jpg", "Optimum Nutrition Gold Standard 100% Whey Protein Double Rich Chocolate 2 lbs tub white background"),
    ("products", "skipping-rope.jpg", "Speed skipping rope jump rope black handles white background"),
    ("products", "gym-shaker.jpg", "Gym protein shaker bottle blender bottle black 500ml white background"),
    ("products", "yoga-mat.jpg", "Yoga mat rolled up blue color white background"),

    # Electronics
    ("products", "iphone-15.jpg", "Apple iPhone 15 blue back view white background single phone"),
    ("products", "airpods-pro.jpg", "Apple AirPods Pro 2nd Gen with magsafe charging case open white background"),
    ("products", "jbl-headphones.jpg", "JBL Tune 720BT Wireless Over-Ear Headphones black white background"),
    ("products", "type-c-cable.jpg", "Anker Type C charging cable white coiled white background"),
    ("products", "samsung-s24.jpg", "Samsung Galaxy S24 Ultra titanium black front and back view white background"),

    # Toys & Games
    ("products", "hot-wheels.jpg", "Hot Wheels single diecast car in blister pack front view white background"),
    ("products", "lego-classic.jpg", "LEGO Classic Creative Bricks box front view white background"),
    ("products", "monopoly.jpg", "Monopoly Board Game classic edition box front view white background"),
    ("products", "rubiks-cube.jpg", "Rubik's Cube 3x3 original single white background"),
    ("products", "nerf-gun.jpg", "Nerf Elite 2.0 Commander RD-6 Blaster white background"),

    # Beauty & Personal Care
    ("products", "nivea-lotion.jpg", "Nivea Body Lotion Extra Whitening 400ml front view white background"),
    ("products", "dove-soap.jpg", "Dove Cream Beauty Bathing Bar soap carton 100g white background"),
    ("products", "loreal-shampoo.jpg", "L'Oreal Paris Total Repair 5 Shampoo 396ml bottle white background"),
    ("products", "gillette-mach3.jpg", "Gillette Mach3 Men's Razor pack white background"),
    ("products", "colgate-toothpaste.jpg", "Colgate Strong Teeth Anticavity Toothpaste 100g tube white background"),

    # Stationery & Office
    ("products", "classmate-notebook.jpg", "Classmate long notebook single line front cover white background"),
    ("products", "reynolds-trimax.jpg", "Reynolds Trimax Liquid Gel Pen Blue single white background"),
    ("products", "apsara-pencils.jpg", "Apsara Platinum Extra Dark Pencils pack of 10 white background"),
    ("products", "fevistick.jpg", "Fevistik Glue Stick 15g single white background"),
    ("products", "camlin-crayons.jpg", "Camel Wax Crayons 12 shades box front view white background"),
]

def fetch_image(query, dest):
    try:
        url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        matches = re.findall(r'murl&quot;:&quot;(http[^&]+?)&quot;', html)
        if matches:
            for img_url in matches:
                if img_url.endswith('.jpg') or img_url.endswith('.png'):
                    try:
                        print(f"Downloading {img_url} for {query}")
                        img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(img_req, timeout=10) as response, open(dest, 'wb') as out_file:
                            out_file.write(response.read())
                        print(f"Success: {query}")
                        return True
                    except Exception as e:
                        print(f"Failed to download {img_url}, trying next...")
                        continue
        print(f"No valid image found for {query}")
    except Exception as e:
        print(f"Error for {query}: {e}")
    return False

for folder, filename, query in to_download:
    dest = os.path.join(base_dir, folder, filename)
    # Skip if already exists to save time, unless you want to overwrite
    if not os.path.exists(dest):
        success = fetch_image(query, dest)
        if not success:
            # fallback query
            fetch_image(query.replace("white background", "").strip(), dest)
    else:
        print(f"Skipping {filename}, already exists.")

print("All downloads complete.")
