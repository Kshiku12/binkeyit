import os
import urllib.request

products_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\products"

to_fix = [
    ("frooti-mango-drink.jpg", "https://images.openfoodfacts.org/images/products/890/159/300/1065/front_en.3.400.jpg"),
    ("red-bull-energy-drink.jpg", "https://images.openfoodfacts.org/images/products/9002490100070/front_en.5.400.jpg"),
    ("britannia-daily-bake-recipe-white-bread.jpg", "https://images.openfoodfacts.org/images/products/890/106/301/1076/front_en.3.400.jpg"),
    ("amul-butter-pasteurized.jpg", "https://images.openfoodfacts.org/images/products/890/126/201/0087/front_en.3.400.jpg"),
    ("lay-s-india-s-magic-masala-potato-chips.jpg", "https://images.openfoodfacts.org/images/products/890/149/110/1011/front_en.3.400.jpg")
]

for filename, url in to_fix:
    dest = os.path.join(products_dir, filename)
    try:
        print(f"Downloading {url} to {filename}")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response, open(dest, 'wb') as out_file:
            out_file.write(response.read())
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
