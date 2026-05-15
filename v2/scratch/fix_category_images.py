import os
import urllib.request
import urllib.parse
import re

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\categories"

to_fix = [
    ("beauty-care.jpg", "shampoo bottle and soap bar group cosmetics white background amazon"),
    ("electronics.jpg", "smartphone with wireless headphones side by side white background amazon"),
    ("stationery.jpg", "spiral notebook with pens and pencils on top white background isolated"),
    ("toys-games.jpg", "rubiks cube and hot wheels toy car white background isolated"),
]

def fetch_image(query, dest):
    try:
        url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        matches = re.findall(r'murl&quot;:&quot;(http[^&]+?)&quot;', html)
        if matches:
            for img_url in matches:
                # filter out obvious stock vectors
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

for filename, query in to_fix:
    dest = os.path.join(base_dir, filename)
    # Remove the bad image first
    if os.path.exists(dest):
        os.remove(dest)
        
    success = fetch_image(query, dest)
    if not success:
        # fallback query
        fetch_image(query.replace("amazon", "").replace("isolated", "").strip(), dest)

print("Fixed categories complete.")
