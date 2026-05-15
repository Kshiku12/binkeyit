import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category } from "../models/Category.js";
import { SubCategory } from "../models/SubCategory.js";
import { Product } from "../models/Product.js";
import { toSlug } from "../utils/slug.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const addBakingProducts = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Create or Find "Sweet Tooth" Category
    let sweetCategory = await Category.findOne({ name: "Sweet Tooth" });
    if (!sweetCategory) {
      sweetCategory = await Category.create({
        name: "Sweet Tooth",
        slug: "sweet-tooth",
        image: "file:///C:/Users/kshit/.gemini/antigravity/brain/2fbfa395-9028-4444-a502-dbb74bb92f53/sweet_tooth_category_icon_1776834019951.png"
      });
    }

    // 2. Create or Find "Baking Essentials" SubCategory
    let bakingSub = await SubCategory.findOne({ name: "Baking Essentials" });
    if (!bakingSub) {
      bakingSub = await SubCategory.create({
        name: "Baking Essentials",
        slug: "baking-essentials",
        category: [sweetCategory._id],
        image: "https://placehold.co/200"
      });
    }

    const bakingProducts = [
      {
        name: "Dark Chocolate Bar",
        price: 150,
        discount: 10,
        unit: "100g",
        description: "Premium dark chocolate with 70% cocoa for baking and gourmet snacking.",
        image: ["file:///C:/Users/kshit/.gemini/antigravity/brain/2fbfa395-9028-4444-a502-dbb74bb92f53/dark_chocolate_bar_1776833918667.png"]
      },
      {
        name: "Vanilla Essence",
        price: 95,
        discount: 5,
        unit: "20ml",
        description: "Pure aromatic vanilla essence to add that classic flavor to your cakes and cookies.",
        image: ["file:///C:/Users/kshit/.gemini/antigravity/brain/2fbfa395-9028-4444-a502-dbb74bb92f53/vanilla_essence_bottle_1776833948763.png"]
      },
      {
        name: "Cocoa Powder",
        price: 120,
        discount: 15,
        unit: "50g",
        description: "Rich unsweetened cocoa powder, perfect for chocolate cakes, brownies, and hot cocoa.",
        image: ["file:///C:/Users/kshit/.gemini/antigravity/brain/2fbfa395-9028-4444-a502-dbb74bb92f53/cocoa_powder_tin_1776833981836.png"]
      }
    ];

    for (const p of bakingProducts) {
      const exists = await Product.findOne({ name: p.name });
      if (!exists) {
        await Product.create({
          ...p,
          slug: `${toSlug(p.name)}-${Date.now()}`,
          category: [sweetCategory._id],
          subCategory: [bakingSub._id],
          stock: 50,
          isPublished: true
        });
        console.log(`Added: ${p.name}`);
      }
    }

    console.log("Baking products update complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating baking products:", error);
    process.exit(1);
  }
};

addBakingProducts();
