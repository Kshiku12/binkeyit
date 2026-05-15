import os
import urllib.request

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\products"

# High-quality direct CDN URLs for these exact products from grocery delivery services
images_to_download = {
    "camel-crayons.jpg": "https://www.bigbasket.com/media/uploads/p/l/104193_1-camel-wax-crayons-12-shades.jpg",
    "thumbs-up.jpg": "https://www.bigbasket.com/media/uploads/p/l/264478_5-thumbs-up-soft-drink.jpg",
    "english-oven-brown-bread.jpg": "https://www.bigbasket.com/media/uploads/p/l/40165916_4-english-oven-brown-bread.jpg",
    "gowardhan-ghee.jpg": "https://www.bigbasket.com/media/uploads/p/l/40005030_2-gowardhan-ghee-cow.jpg"
}

for filename, url in images_to_download.items():
    dest = os.path.join(base_dir, filename)
    try:
        print(f"Downloading {filename} from {url}")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response, open(dest, 'wb') as out_file:
            out_file.write(response.read())
        print(f"Successfully downloaded {filename}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")
