import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";

dotenv.config();

const BASE_URL = "http://localhost:8081/assets";

const fixImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Update Sweet Tooth Category
    await Category.updateOne(
      { name: "Sweet Tooth" },
      { $set: { image: `${BASE_URL}/sweet_tooth_category_icon_1776834019951.png` } }
    );

    // 2. Update Baking Products
    const updates = [
      { name: "Dark Chocolate Bar", img: "dark_chocolate_bar_1776833918667.png" },
      { name: "Vanilla Essence", img: "vanilla_essence_bottle_1776833948763.png" },
      { name: "Cocoa Powder", img: "cocoa_powder_tin_1776833981836.png" }
    ];

    for (const u of updates) {
      await Product.updateOne(
        { name: u.name },
        { $set: { image: [`${BASE_URL}/${u.img}`] } }
      );
      console.log(`Updated image for: ${u.name}`);
    }

    console.log("Image fix complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing images:", error);
    process.exit(1);
  }
};

fixImages();
