import os
import re
import urllib.request
import urllib.parse
import time

seed_file = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\api\src\scripts\seedSampleData.js"
base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\products"

def fetch_image_bing(query, dest):
    try:
        url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        matches = re.findall(r'murl&quot;:&quot;(http[^&]+?)&quot;', html)
        if matches:
            for img_url in matches:
                # Avoid generic stock if possible
                if 'alamy' in img_url.lower() or 'dreamstime' in img_url.lower() or 'vector' in img_url.lower() or 'stock' in img_url.lower():
                    continue
                if img_url.endswith('.jpg') or img_url.endswith('.png') or img_url.endswith('.jpeg'):
                    try:
                        img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(img_req, timeout=8) as response, open(dest, 'wb') as out_file:
                            out_file.write(response.read())
                        print(f"  Success: {query}")
                        return True
                    except:
                        continue
    except Exception as e:
        pass
    return False

with open(seed_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: image: ["/images/products/filename.jpg"]
# We also need the product name to make a good query. Let's just match the whole object line.
# Example: { name: "Tata Salt, Vacuum Evaporated", unit: "1 kg", price: 28, image: ["/images/products/tata-salt-vacuum-evaporated.jpg"] },

lines = content.split('\n')
new_lines = []

for line in lines:
    match = re.search(r'name:\s*"([^"]+)",.*image:\s*\["(/images/products/([^"]+)\.jpg)"\]', line)
    if match:
        product_name = match.group(1)
        base_path = match.group(2)
        base_filename = match.group(3)
        
        print(f"Processing: {product_name} ({base_filename})")
        
        img2_name = f"{base_filename}-2.jpg"
        img3_name = f"{base_filename}-3.jpg"
        img2_path = os.path.join(base_dir, img2_name)
        img3_path = os.path.join(base_dir, img3_name)
        
        # Download image 2 (back / nutrition / side)
        if not os.path.exists(img2_path):
            success2 = fetch_image_bing(f"site:amazon.in {product_name} back packaging nutrition facts", img2_path)
            if not success2:
                fetch_image_bing(f"{product_name} back packaging", img2_path)
            time.sleep(0.5)
                
        # Download image 3 (lifestyle / usage / ingredients)
        if not os.path.exists(img3_path):
            success3 = fetch_image_bing(f"site:amazon.in {product_name} ingredients details", img3_path)
            if not success3:
                fetch_image_bing(f"{product_name} close up", img3_path)
            time.sleep(0.5)
                
        # Replace the image array in the line
        old_image_arr = f'image: ["{base_path}"]'
        new_image_arr = f'image: ["{base_path}", "/images/products/{img2_name}", "/images/products/{img3_name}"]'
        
        new_line = line.replace(old_image_arr, new_image_arr)
        new_lines.append(new_line)
    else:
        new_lines.append(line)

with open(seed_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("Seed file updated with multiple images!")
