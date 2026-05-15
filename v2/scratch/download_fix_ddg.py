import os
import urllib.request
from duckduckgo_search import DDGS
import time

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\products"
os.makedirs(base_dir, exist_ok=True)

images_to_download = {
    "camel-crayons.jpg": "site:amazon.in Camel Wax Crayons 12 Shades",
    "thumbs-up.jpg": "site:amazon.in Thumbs Up Soft Drink 750ml plastic bottle",
    "english-oven-brown-bread.jpg": "site:amazon.in English Oven Brown Bread 400g packet",
    "gowardhan-ghee.jpg": "site:amazon.in Gowardhan Ghee 500ml pure ghee"
}

ddgs = DDGS()

for filename, query in images_to_download.items():
    dest = os.path.join(base_dir, filename)
    print(f"Searching for: {query}")
    try:
        results = list(ddgs.images(query, max_results=3))
        downloaded = False
        for res in results:
            img_url = res.get('image')
            if not img_url:
                continue
            # avoid webp if possible, but fine if not
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
        if not downloaded:
            print(f"Could not find valid image for {filename}")
    except Exception as e:
        print(f"Error searching {query}: {e}")
    time.sleep(1)

print("Done.")
