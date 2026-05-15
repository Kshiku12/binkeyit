import os
import urllib.request
from duckduckgo_search import DDGS
import time

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\categories"
os.makedirs(base_dir, exist_ok=True)

categories = [
    ("atta-rice-dal.jpg", "indian grocery rice dal atta packets collection isolated white background -vector -text"),
    ("dairy-bread-eggs.jpg", "milk bottle loaf bread brown eggs amul butter group isolated white background -vector -text"),
    ("cold-drinks-juices.jpg", "coca cola bottle sprite tropicana juice cans group isolated white background -vector -text"),
    ("snacks-munchies.jpg", "lays kurkure doritos chips packets group isolated white background -vector -text"),
    ("fruits-vegetables.jpg", "fresh vegetables fruits basket tomato onion banana isolated white background -vector -text"),
    ("poker-party.jpg", "poker chips playing cards uno isolated white background -vector -text"),
    ("gym-training.jpg", "dumbbells whey protein jar gym equipment isolated white background -vector -text"),
    ("electronics.jpg", "smartphone headphones charger cable gadgets isolated white background -vector -text"),
    ("toys-games.jpg", "lego blocks hot wheels toy car monopoly box isolated white background -vector -text"),
    ("beauty-care.jpg", "shampoo bottle soap lotion cosmetics group isolated white background -vector -text"),
    ("stationery.jpg", "notebooks pens pencils crayons office stationery group isolated white background -vector -text")
]

ddgs = DDGS()

for filename, query in categories:
    dest = os.path.join(base_dir, filename)
    print(f"Searching DDG for: {query}")
    try:
        results = list(ddgs.images(query, max_results=10))
        downloaded = False
        for res in results:
            img_url = res.get('image')
            if not img_url or "alamy" in img_url.lower() or "dreamstime" in img_url.lower() or "shutterstock" in img_url.lower() or "stock" in img_url.lower():
                continue # Skip heavily watermarked stock photo sites if possible
                
            print(f"Downloading {img_url}")
            try:
                req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as response, open(dest, 'wb') as out_file:
                    out_file.write(response.read())
                print(f"Successfully downloaded {filename}")
                downloaded = True
                break
            except Exception as e:
                print(f"Failed to fetch {img_url}: {e}")
        
        # If all filtered failed, just grab the first one
        if not downloaded and len(results) > 0:
            for res in results:
                img_url = res.get('image')
                try:
                    req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=10) as response, open(dest, 'wb') as out_file:
                        out_file.write(response.read())
                    print(f"Fallback downloaded {filename} from {img_url}")
                    downloaded = True
                    break
                except:
                    continue

    except Exception as e:
        print(f"Error searching {query}: {e}")
    time.sleep(1)

print("All category images processed.")
