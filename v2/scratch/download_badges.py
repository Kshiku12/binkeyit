import os
import urllib.request
import urllib.parse
import re

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\badges"
os.makedirs(base_dir, exist_ok=True)

badges = [
    ("quality-badge.jpg", "100% genuine quality guarantee badge green circle isolated white background"),
    ("delivery-badge.jpg", "superfast delivery truck badge icon orange circle isolated white background")
]

def fetch_image_bing(query, dest):
    try:
        url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        matches = re.findall(r'murl&quot;:&quot;(http[^&]+?)&quot;', html)
        if matches:
            for img_url in matches:
                if 'alamy' in img_url.lower() or 'dreamstime' in img_url.lower():
                    continue
                if img_url.endswith('.jpg') or img_url.endswith('.png'):
                    try:
                        img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(img_req, timeout=10) as response, open(dest, 'wb') as out_file:
                            out_file.write(response.read())
                        print(f"Success: {query}")
                        return True
                    except:
                        continue
    except Exception as e:
        pass
    return False

for filename, query in badges:
    dest = os.path.join(base_dir, filename)
    fetch_image_bing(query, dest)
