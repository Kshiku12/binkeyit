import os
import urllib.request

products_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\products"
dest = os.path.join(products_dir, "britannia-daily-bake-recipe-white-bread.jpg")

for i in range(1, 15):
    url = f"https://www.bigbasket.com/media/uploads/p/l/40003013_{i}-britannia-daily-bake-recipe-white-bread.jpg"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = response.read()
            if len(data) > 1000:  # If image is > 1KB, it's valid
                with open(dest, 'wb') as out_file:
                    out_file.write(data)
                print(f"Success with {url}")
                break
    except Exception as e:
        print(f"Failed {url}: {e}")
