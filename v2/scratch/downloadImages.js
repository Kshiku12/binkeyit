import { image_search } from 'duckduckgo-images-api';
import fs from 'fs';
import path from 'path';
import https from 'https';

const baseDir = 'c:\\Users\\kshit\\OneDrive\\Desktop\\Blinkit-Clone_Grp27\\v2\\apps\\web\\public\\images';
const productsDir = path.join(baseDir, 'products');
const categoriesDir = path.join(baseDir, 'categories');

if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true });
if (!fs.existsSync(categoriesDir)) fs.mkdirSync(categoriesDir, { recursive: true });

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        downloadImage(response.headers.location, dest).then(resolve).catch(reject);
      } else {
        reject(`Server responded with ${response.statusCode}: ${response.statusMessage}`);
      }
    }).on('error', reject);
  });
}

function toSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

const queries = {
  categories: [
    { name: "Atta, Rice & Dal", query: "Indian groceries basket hd" },
    { name: "Dairy, Bread & Eggs", query: "Dairy bread eggs basket realistic hd" },
    { name: "Cold Drinks & Juices", query: "Cold drinks soda juice assortment hd" },
    { name: "Snacks & Munchies", query: "Indian snacks chips biscuits assortment hd" },
    { name: "Fruits & Vegetables", query: "Fresh fruits and vegetables basket hd" }
  ],
  products: [
    "Aashirvaad Shudh Chakki Atta 5kg packaging",
    "Fortune Rozana Basmati Rice packaging",
    "Tata Salt Vacuum Evaporated packaging",
    "Tata Sampann Toor Dal packaging",
    "India Gate Basmati Rice packaging",
    "Amul Taaza Toned Fresh Milk packaging",
    "Britannia Daily Bake Recipe White Bread packaging",
    "Farm Fresh White Eggs carton",
    "Amul Butter Pasteurized packaging",
    "Mother Dairy Paneer packaging",
    "Coca-Cola Original Taste 750ml bottle",
    "Real Fruit Power Mixed Fruit Juice 1L",
    "Sprite Lemon Lime Soft Drink bottle",
    "Pepsi Soft Drink bottle",
    "Frooti Mango Drink packaging",
    "Red Bull Energy Drink can",
    "Lay's India's Magic Masala Potato Chips packaging",
    "Haldiram's Bhujia Sev packaging",
    "Oreo Original Choco Creme Biscuit packaging",
    "Kurkure Masala Munch packaging",
    "Parle-G Gold Biscuits packaging",
    "Fresh Red Onion",
    "Fresh Tomato",
    "Banana Robusta",
    "Fresh Potato",
    "Green Chilli"
  ]
};

async function fetchImage(query, dest) {
  try {
    const results = await image_search({ query: query, moderate: true, iterations: 1 });
    if (results && results.length > 0) {
      // Find the first URL that ends in jpg or png and works
      for (const result of results) {
         try {
           console.log(`Downloading ${result.image} for ${query}`);
           await downloadImage(result.image, dest);
           console.log(`Successfully downloaded: ${query}`);
           return;
         } catch(e) {
           console.log(`Failed to download ${result.image}, trying next...`);
         }
      }
    }
    console.log(`No valid image found for: ${query}`);
  } catch(e) {
    console.error(`Error searching for ${query}:`, e);
  }
}

async function run() {
  console.log("Downloading category images...");
  for (const cat of queries.categories) {
    const slug = toSlug(cat.name);
    const dest = path.join(categoriesDir, `${slug}.jpg`);
    await fetchImage(cat.query, dest);
  }

  console.log("Downloading product images...");
  for (const prod of queries.products) {
    // We'll just use the raw product name (before 'packaging' etc) for the slug to match seedSampleData
    const baseName = prod.replace(/ packaging| carton| bottle| can| 5kg| 1L| 750ml/g, "");
    const slug = toSlug(baseName);
    const dest = path.join(productsDir, `${slug}.jpg`);
    await fetchImage(prod, dest);
  }

  console.log("All downloads completed.");
}

run();
