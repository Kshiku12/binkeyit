import os
import urllib.request

products_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\products"
dest = os.path.join(products_dir, "amul-butter-pasteurized.jpg")

for i in range(1, 15):
    for ext in ["", "-carton"]:
        url = f"https://www.bbassets.com/media/uploads/p/l/120387_{i}-amul-pasteurised-butter{ext}.jpg"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = response.read()
                if len(data) > 1000:
                    with open(dest, 'wb') as out_file:
                        out_file.write(data)
                    print(f"Success with {url}")
                    exit(0)
        except Exception as e:
            print(f"Failed {url}")
