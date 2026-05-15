import os
import urllib.request
import urllib.parse
import re
import time

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\categories"

categories = [
    ("atta-rice-dal.jpg", "site:bigbasket.com atta rice dal category banner isolated white"),
    ("dairy-bread-eggs.jpg", "milk bread eggs butter group isolated white background grocery"),
    ("cold-drinks-juices.jpg", "coca cola pepsi frooti bottles cans group isolated white background"),
    ("snacks-munchies.jpg", "lays kurkure doritos chips packets group isolated white background"),
    ("fruits-vegetables.jpg", "fresh vegetables fruits basket tomato onion banana isolated white background"),
    ("poker-party.jpg", "poker chips playing cards uno isolated white background"),
    ("gym-training.jpg", "dumbbells whey protein jar gym equipment isolated white background"),
    ("electronics.jpg", "smartphone headphones charger cable gadgets isolated white background"),
    ("toys-games.jpg", "hot wheels toy car monopoly box rubiks cube isolated white background"),
    ("beauty-care.jpg", "shampoo bottle soap lotion cosmetics group isolated white background"),
    ("stationery.jpg", "notebooks pens pencils crayons office stationery group isolated white background")
]

def fetch_image_bing(query, dest):
    try:
        url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        matches = re.findall(r'murl&quot;:&quot;(http[^&]+?)&quot;', html)
        if matches:
            for img_url in matches:
                # filter out obvious stock watermarks
                if 'alamy' in img_url.lower() or 'dreamstime' in img_url.lower() or 'vector' in img_url.lower():
                    continue
                if img_url.endswith('.jpg') or img_url.endswith('.png') or img_url.endswith('.jpeg'):
                    try:
                        print(f"Downloading {img_url} for {query}")
                        img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(img_req, timeout=10) as response, open(dest, 'wb') as out_file:
                            out_file.write(response.read())
                        print(f"Success: {query}")
                        return True
                    except Exception as e:
                        continue
        print(f"No valid image found for {query}")
    except Exception as e:
        print(f"Error for {query}: {e}")
    return False

for filename, query in categories:
    dest = os.path.join(base_dir, filename)
    success = fetch_image_bing(query, dest)
    if not success:
        # Retry with simpler query
        fetch_image_bing(query.replace("isolated white background", "").strip(), dest)
    time.sleep(1)

print("All category images processed.")
