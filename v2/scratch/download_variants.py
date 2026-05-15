import os
import urllib.request
import urllib.parse
import re

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\products\variants"
os.makedirs(base_dir, exist_ok=True)

to_download = [
    # Eggs
    ("egg-1.jpg", "farm fresh white eggs 6 pcs carton white background isolated amazon"),
    ("egg-2.jpg", "eggs cracked open yolk in bowl white background"),
    ("egg-3.jpg", "eggs in a tray top down view white background"),
    
    # Atta
    ("atta-1.jpg", "Aashirvaad Shudh Chakki Atta 5kg pack front view white background amazon"),
    ("atta-2.jpg", "wheat flour bowl white background isolated"),
    ("atta-3.jpg", "wheat grains close up pile white background"),

    # Onion
    ("onion-1.jpg", "fresh red onion single white background isolated"),
    ("onion-2.jpg", "sliced red onion rings white background isolated"),
    ("onion-3.jpg", "pile of fresh red onions white background isolated")
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

for filename, query in to_download:
    dest = os.path.join(base_dir, filename)
    if not os.path.exists(dest):
        success = fetch_image(query, dest)
        if not success:
            fetch_image(query.replace("amazon", "").strip(), dest)
    else:
        print(f"Skipping {filename}, already exists.")

print("All downloads complete.")
