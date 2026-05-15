import os
import urllib.request
import urllib.parse
import re

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images"
products_dir = os.path.join(base_dir, "products")
categories_dir = os.path.join(base_dir, "categories")

os.makedirs(products_dir, exist_ok=True)
os.makedirs(categories_dir, exist_ok=True)

queries = {
    "categories": [
        {"name": "Atta, Rice & Dal", "query": "Indian grocery basket high quality"},
        {"name": "Dairy, Bread & Eggs", "query": "Dairy bread eggs basket realistic high quality"},
        {"name": "Cold Drinks & Juices", "query": "Cold drinks juice assortment basket high quality"},
        {"name": "Snacks & Munchies", "query": "Indian snacks chips assortment high quality"},
        {"name": "Fruits & Vegetables", "query": "Fresh fruits vegetables basket high quality"}
    ],
    "products": [
        "Aashirvaad Shudh Chakki Atta 5kg packaging official",
        "Fortune Rozana Basmati Rice packaging official",
        "Tata Salt Vacuum Evaporated packaging official",
        "Tata Sampann Toor Dal packaging official",
        "India Gate Basmati Rice packaging official",
        "Amul Taaza Toned Fresh Milk packaging official",
        "Britannia Daily Bake Recipe White Bread packaging",
        "Farm Fresh White Eggs carton official",
        "Amul Butter Pasteurized packaging official",
        "Mother Dairy Paneer packaging official",
        "Coca-Cola Original Taste 750ml bottle official",
        "Real Fruit Power Mixed Fruit Juice 1L official",
        "Sprite Lemon Lime Soft Drink bottle official",
        "Pepsi Soft Drink bottle official",
        "Frooti Mango Drink packaging official",
        "Red Bull Energy Drink can official",
        "Lay's India's Magic Masala Potato Chips packaging official",
        "Haldiram's Bhujia Sev packaging official",
        "Oreo Original Choco Creme Biscuit packaging official",
        "Kurkure Masala Munch packaging official",
        "Parle-G Gold Biscuits packaging official",
        "Fresh Red Onion official",
        "Fresh Tomato official",
        "Banana Robusta official",
        "Fresh Potato official",
        "Green Chilli official"
    ]
}

def to_slug(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def fetch_image(query, dest):
    try:
        url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        # Bing images stores direct URLs in the murl attribute
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

print("Downloading categories...")
for cat in queries["categories"]:
    slug = to_slug(cat["name"])
    dest = os.path.join(categories_dir, f"{slug}.jpg")
    fetch_image(cat["query"], dest)

print("Downloading products...")
for prod in queries["products"]:
    base_name = re.sub(r' packaging| carton| bottle| can| 5kg| 1L| 750ml| official', '', prod, flags=re.IGNORECASE).strip()
    slug = to_slug(base_name)
    dest = os.path.join(products_dir, f"{slug}.jpg")
    
    success = fetch_image(prod, dest)
    if not success:
        fetch_image(base_name + " high quality", dest)

print("Done.")
