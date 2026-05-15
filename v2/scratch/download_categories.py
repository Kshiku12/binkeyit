import os
import urllib.request
import urllib.parse
import re

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\categories"
os.makedirs(base_dir, exist_ok=True)

categories = [
    ("beauty-care.jpg", "beauty cosmetics makeup products display amazon fresh top down white background"),
    ("electronics.jpg", "latest smartphones headphones electronics gadgets display white background"),
    ("toys-games.jpg", "kids toys board games colorful display white background isolated"),
    ("stationery.jpg", "office stationery pens notebooks white background isolated"),
    ("gym-training.jpg", "dumbbells protein powder gym equipments white background isolated"),
    ("poker-party.jpg", "poker chips playing cards party supplies white background isolated"),
    ("fruits-vegetables.jpg", "fresh vegetables fruits basket white background isolated amazon fresh"),
    ("snacks-munchies.jpg", "potato chips namkeen biscuits snacks collection white background isolated amazon fresh"),
    ("cold-drinks-juices.jpg", "soft drinks juices bottles collection white background isolated"),
    ("dairy-bread-eggs.jpg", "milk bread eggs butter dairy collection white background isolated amazon fresh"),
    ("atta-rice-dal.jpg", "atta rice dal pulses grains packets collection white background isolated amazon fresh")
]

def fetch_image(query, dest):
    try:
        url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        matches = re.findall(r'murl&quot;:&quot;(http[^&]+?)&quot;', html)
        if matches:
            for img_url in matches:
                if 'vector' in img_url.lower() or 'stock' in img_url.lower() or 'icon' in img_url.lower():
                    continue
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

for filename, query in categories:
    dest = os.path.join(base_dir, filename)
    success = fetch_image(query, dest)
    if not success:
        fetch_image(query.replace("amazon fresh", "").strip(), dest)

print("All category images downloaded.")
