import os
import urllib.request
import urllib.parse
import re

products_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\products"

to_fix = [
    ("frooti-mango-drink.jpg", "Frooti Mango Drink 1L pet plastic bottle front view white background single"),
    ("red-bull-energy-drink.jpg", "Red Bull Energy Drink 250ml can single front view white background"),
    ("britannia-daily-bake-recipe-white-bread.jpg", "Britannia White Bread 400g packet single front view white background"),
    ("amul-butter-pasteurized.jpg", "Amul Butter Pasteurized 100g single carton box front view white background"),
    ("lay-s-india-s-magic-masala-potato-chips.jpg", "Lay's India's Magic Masala Potato Chips 50g blue packet front view single")
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

for filename, query in to_fix:
    dest = os.path.join(products_dir, filename)
    success = fetch_image(query, dest)
    if not success:
        # fallback query
        fetch_image(query.replace("white background", "").strip(), dest)

print("Done.")
