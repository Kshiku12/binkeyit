import fs from 'fs';
import https from 'https';

async function fetchFromOFF(category, limit) {
  return new Promise((resolve, reject) => {
    // Search OpenFoodFacts for products in India matching the category
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(category)}&search_simple=1&action=process&json=1&page_size=${limit}&countries=India`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.products || []);
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log("Fetching real products from Open Food Facts API...");
  const categories = [
    { name: "Atta, Rice & Dal", query: "rice dal atta", limit: 15 },
    { name: "Dairy, Bread & Eggs", query: "milk bread cheese", limit: 15 },
    { name: "Cold Drinks & Juices", query: "drink juice soda", limit: 15 },
    { name: "Snacks & Munchies", query: "chips snack biscuit", limit: 15 },
    { name: "Fruits & Vegetables", query: "fruit vegetable", limit: 15 }
  ];

  const finalProducts = {};
  const finalCategories = [];

  for (const cat of categories) {
    console.log(`Fetching products for category: ${cat.name}`);
    const products = await fetchFromOFF(cat.query, cat.limit);
    
    // Category images - using high quality Unsplash photos of baskets for categories
    const catImages = {
      "Atta, Rice & Dal": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80",
      "Dairy, Bread & Eggs": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=80",
      "Cold Drinks & Juices": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
      "Snacks & Munchies": "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&q=80",
      "Fruits & Vegetables": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80"
    };

    finalCategories.push({ name: cat.name, image: catImages[cat.name] });
    finalProducts[cat.name] = [];

    for (const p of products) {
      if (p.product_name && p.image_front_url) {
        finalProducts[cat.name].push({
          name: p.product_name,
          unit: p.quantity || "1 pc",
          price: Math.floor(Math.random() * (300 - 20 + 1)) + 20,
          image: p.image_front_url
        });
      }
    }
  }

  fs.writeFileSync('c:\\Users\\kshit\\OneDrive\\Desktop\\Blinkit-Clone_Grp27\\v2\\apps\\api\\src\\scripts\\generatedSeedData.json', JSON.stringify({ categories: finalCategories, products: finalProducts }, null, 2));
  console.log("Done generating data.");
}

run();
