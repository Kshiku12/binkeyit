import os
import urllib.request
import re
import urllib.parse
from html.parser import HTMLParser

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\products"
os.makedirs(base_dir, exist_ok=True)

images_to_download = {
    "camel-crayons.jpg": "Camel Wax Crayons 12 Shades pack front amazon",
    "thumbs-up.jpg": "Thumbs Up Soft Drink 750ml plastic bottle front",
    "english-oven-brown-bread.jpg": "English Oven Brown Bread 400g packet front",
    "gowardhan-ghee.jpg": "Gowardhan Ghee 500ml cow pure ghee front"
}

def fetch_image_ddg(query, dest):
    print(f"Searching DuckDuckGo for: {query}")
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query + " filetype:jpg")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        
        # DuckDuckGo HTML puts image URLs in vqd or just direct links
        # Actually, let's just use Yahoo Image search as it's simpler
    except Exception as e:
        print(f"Failed DDG: {e}")

def fetch_image_yahoo(query, dest):
    print(f"Searching Yahoo Images for: {query}")
    url = "https://images.search.yahoo.com/search/images?p=" + urllib.parse.quote(query)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        
        # Yahoo images use 'imgurl=' inside the HTML
        matches = re.findall(r'imgurl=(http[^&]+)', html)
        for m in matches:
            img_url = urllib.parse.unquote(m)
            if 'stock' in img_url.lower() or 'alamy' in img_url.lower() or 'dreamstime' in img_url.lower() or '123rf' in img_url.lower():
                continue
            print(f"Downloading: {img_url}")
            try:
                img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(img_req, timeout=10) as response, open(dest, 'wb') as out_file:
                    out_file.write(response.read())
                print(f"Successfully saved {dest}")
                return True
            except Exception as e:
                print(f"Failed to download image {img_url}: {e}")
                continue
    except Exception as e:
        print(f"Failed Yahoo: {e}")
    return False

for filename, query in images_to_download.items():
    dest = os.path.join(base_dir, filename)
    fetch_image_yahoo(query, dest)

