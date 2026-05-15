import os
import urllib.request
import urllib.parse
import re
import time

base_dir = r"c:\Users\kshit\OneDrive\Desktop\Blinkit-Clone_Grp27\v2\apps\web\public\images\products"
os.makedirs(base_dir, exist_ok=True)

products = [
    ("india-gate-basmati.jpg", "India Gate Basmati Rice Classic packet white background"),
    ("patanjali-atta.jpg", "Patanjali Whole Wheat Atta packet white background"),
    ("tata-sampann-toor-dal.jpg", "Tata Sampann Toor Dal packet white background"),
    ("amul-gold-milk.jpg", "Amul Gold Full Cream Milk packet white background"),
    ("english-oven-brown-bread.jpg", "English Oven Brown Bread packet white background"),
    ("mother-dairy-curd.jpg", "Mother Dairy Classic Curd cup white background"),
    ("amul-cheese-slices.jpg", "Amul Cheese Slices packet white background"),
    ("gowardhan-ghee.jpg", "Gowardhan Ghee jar white background"),
    ("fresh-potato.jpg", "Fresh Potato vegetable white background"),
    ("fresh-garlic.jpg", "Fresh Garlic bulb white background"),
    ("fresh-ginger.jpg", "Fresh Ginger root white background"),
    ("fresh-lemon.jpg", "Fresh Lemon fruit white background"),
    ("pepsi.jpg", "Pepsi Soft Drink bottle white background"),
    ("thumbs-up.jpg", "Thumbs Up Soft Drink bottle white background"),
    ("red-bull.jpg", "Red Bull Energy Drink can white background"),
    ("tropicana.jpg", "Tropicana 100% Orange Juice carton white background"),
    ("frooti.jpg", "Frooti Mango Drink bottle white background"),
    ("doritos.jpg", "Doritos Nacho Cheese packet white background"),
    ("kurkure.jpg", "Kurkure Masala Munch packet white background"),
    ("bingo-mad-angles.jpg", "Bingo Mad Angles packet white background"),
    ("oreo.jpg", "Oreo Original Choco Creme packet white background"),
    ("parle-g.jpg", "Parle-G Gold Biscuits packet white background"),
    ("good-day-cashew.jpg", "Britannia Good Day Cashew biscuits packet white background"),
    ("uno-cards.jpg", "UNO Card Game pack white background"),
    ("party-popper.jpg", "Party Popper white background"),
    ("paper-cups.jpg", "Paper Cups stack white background"),
    ("birthday-candles.jpg", "Birthday Candles pack white background"),
    ("balloons.jpg", "Balloon Pack Multicolor white background"),
    ("yoga-mat.jpg", "Yoga Mat Blue rolled white background"),
    ("skipping-rope.jpg", "Skipping Rope white background"),
    ("protein-shaker.jpg", "Protein Shaker Bottle white background"),
    ("push-up-bars.jpg", "Push-up Bars pair white background"),
    ("resistance-bands.jpg", "Resistance Bands Set white background"),
    ("s24-ultra.jpg", "Samsung Galaxy S24 Ultra phone white background"),
    ("oneplus-12.jpg", "OnePlus 12 phone white background"),
    ("jbl-tune.jpg", "JBL Tune 720BT Wireless Headphones white background"),
    ("anker-type-c.jpg", "Anker Type C Charging Cable white background"),
    ("sony-xm5.jpg", "Sony WH-1000XM5 headphones white background"),
    ("monopoly.jpg", "Monopoly Board Game Classic box white background"),
    ("rubiks-cube.jpg", "Rubik's Cube 3x3 white background"),
    ("nerf.jpg", "Nerf Elite 2.0 Commander blaster white background"),
    ("barbie.jpg", "Barbie Fashionistas Doll box white background"),
    ("jenga.jpg", "Jenga Classic Game box white background"),
    ("loreal-shampoo.jpg", "Loreal Paris Total Repair 5 Shampoo bottle white background"),
    ("gillette.jpg", "Gillette Mach3 Mens Razor white background"),
    ("colgate.jpg", "Colgate Strong Teeth Toothpaste box white background"),
    ("himalaya-facewash.jpg", "Himalaya Purifying Neem Face Wash tube white background"),
    ("vaseline.jpg", "Vaseline Intensive Care Lotion bottle white background"),
    ("apsara-pencils.jpg", "Apsara Platinum Extra Dark Pencils box white background"),
    ("fevistik.jpg", "Fevistik Glue tube white background"),
    ("camel-crayons.jpg", "Camel Wax Crayons box white background"),
    ("cello-gripper.jpg", "Cello Gripper Pen pack white background"),
    ("sticky-notes.jpg", "Post-it Sticky Notes pad white background")
]

def fetch_image(query, dest):
    try:
        url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        matches = re.findall(r'murl&quot;:&quot;(http[^&]+?)&quot;', html)
        if matches:
            for img_url in matches:
                if 'vector' in img_url.lower() or 'stock' in img_url.lower() or 'icon' in img_url.lower():
                    continue
                if img_url.endswith('.jpg') or img_url.endswith('.png'):
                    try:
                        print(f"Downloading {img_url} for {query}")
                        img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(img_req, timeout=10) as response, open(dest, 'wb') as out_file:
                            out_file.write(response.read())
                        print(f"Success: {query}")
                        return True
                    except Exception as e:
                        continue
        print(f"No valid image found for {query}")
    except Exception as e:
        print(f"Error for {query}: {e}")
    return False

for filename, query in products:
    dest = os.path.join(base_dir, filename)
    if os.path.exists(dest):
        print(f"Skipping {filename}, already exists")
        continue
    success = fetch_image(query, dest)
    if not success:
        # Try a simpler query
        fetch_image(query.replace("white background", "").strip(), dest)
    time.sleep(1) # Prevent rate limiting

print("All product images downloaded.")
