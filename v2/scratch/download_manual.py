import os
import urllib.request
import re

products_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\products"

to_fix = [
    ("frooti-mango-drink.jpg", "https://www.bigbasket.com/pd/266070/frooti-drink-mango-1-l/"),
    ("red-bull-energy-drink.jpg", "https://www.bigbasket.com/pd/266579/red-bull-energy-drink-250-ml/"),
    ("britannia-daily-bake-recipe-white-bread.jpg", "https://www.bigbasket.com/pd/40003013/britannia-daily-bake-recipe-white-bread-400-g/"),
    ("amul-butter-pasteurized.jpg", "https://www.bigbasket.com/pd/120387/amul-pasteurised-butter-100-g-carton/"),
    ("lay-s-india-s-magic-masala-potato-chips.jpg", "https://www.bigbasket.com/pd/294297/lays-potato-chips-indias-magic-masala-50-g/")
]

for filename, url in to_fix:
    dest = os.path.join(products_dir, filename)
    try:
        print(f"Fetching {url}")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'})
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        
        # Bigbasket images are like https://www.bigbasket.com/media/uploads/p/l/266070_13-frooti-drink-mango.jpg
        # Or look for any image url ending in .jpg in the uploads folder
        matches = re.findall(r'https://www.bigbasket.com/media/uploads/p/[l|xxl]/[^"\'<]+\.jpg', html)
        if matches:
            img_url = matches[0]
            print(f"Downloading image {img_url} to {filename}")
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(img_req, timeout=10) as response, open(dest, 'wb') as out_file:
                out_file.write(response.read())
            print("Success")
        else:
            print("No image URL found in HTML.")
    except Exception as e:
        print(f"Error: {e}")
