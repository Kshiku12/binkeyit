import mongoose from "mongoose";
import { connectDb } from "../db/connect.js";
import { Category } from "../models/Category.js";
import { SubCategory } from "../models/SubCategory.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { toSlug } from "../utils/slug.js";
import bcrypt from "bcryptjs";

const seed = async () => {
  await connectDb();

  const adminEmail = "admin@blinkitv2.local";
  const riderEmail = "rider@blinkitv2.local";

  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      name: "Main Admin",
      email: adminEmail,
      password: await bcrypt.hash("Admin@123", 10),
      role: "ADMIN",
      isEmailVerified: true
    },
    { upsert: true, new: true }
  );

  await User.findOneAndUpdate(
    { email: riderEmail },
    {
      name: "Primary Rider",
      email: riderEmail,
      password: await bcrypt.hash("Rider@123", 10),
      role: "RIDER",
      isEmailVerified: true
    },
    { upsert: true, new: true }
  );

  const categories = [
    { name: "Atta, Rice & Dal", image: "/images/categories/atta-rice-dal.jpg" },
    { name: "Dairy, Bread & Eggs", image: "/images/categories/dairy-bread-eggs.jpg" },
    { name: "Cold Drinks & Juices", image: "/images/categories/cold-drinks-juices.jpg" },
    { name: "Snacks & Munchies", image: "/images/categories/snacks-munchies.jpg" },
    { name: "Fruits & Vegetables", image: "/images/categories/fruits-vegetables.jpg" },
    { name: "Poker & Party", image: "/images/categories/poker-party.jpg" },
    { name: "Gym & Training", image: "/images/categories/gym-training.jpg" },
    { name: "Electronics", image: "/images/categories/electronics.jpg" },
    { name: "Toys & Games", image: "/images/categories/toys-games.jpg" },
    { name: "Beauty & Personal Care", image: "/images/categories/beauty-care.jpg" },
    { name: "Stationery & Office", image: "/images/categories/stationery.jpg" }
  ];

  const realisticProducts = {
    "Atta, Rice & Dal": [
      { 
        name: "Aashirvaad Shudh Chakki Atta", 
        unit: "1 kg", 
        price: 55, 
        image: ["/images/products/variants/atta-1.jpg", "/images/products/variants/atta-2.jpg", "/images/products/variants/atta-3.jpg"],
        description: "Aashirvaad Shudh Chakki Atta is made using the 4-step advantage process which ensures 100% pure and natural whole wheat atta and retention of its natural dietary fibres and nutrients.",
        moreDetails: { "Shelf Life": "3 Months", "Manufacturer": "ITC Limited", "Country of Origin": "India" }
      },
      { 
        name: "Aashirvaad Shudh Chakki Atta", 
        unit: "5 kg", 
        price: 230, 
        image: ["/images/products/variants/atta-1.jpg", "/images/products/variants/atta-2.jpg", "/images/products/variants/atta-3.jpg"],
        description: "Aashirvaad Shudh Chakki Atta is made using the 4-step advantage process which ensures 100% pure and natural whole wheat atta and retention of its natural dietary fibres and nutrients.",
        moreDetails: { "Shelf Life": "3 Months", "Manufacturer": "ITC Limited", "Country of Origin": "India" }
      },
      { 
        name: "Aashirvaad Shudh Chakki Atta", 
        unit: "10 kg", 
        price: 440, 
        image: ["/images/products/variants/atta-1.jpg", "/images/products/variants/atta-2.jpg", "/images/products/variants/atta-3.jpg"],
        description: "Aashirvaad Shudh Chakki Atta is made using the 4-step advantage process which ensures 100% pure and natural whole wheat atta and retention of its natural dietary fibres and nutrients.",
        moreDetails: { "Shelf Life": "3 Months", "Manufacturer": "ITC Limited", "Country of Origin": "India" }
      },
      { name: "Fortune Rozana Basmati Rice", unit: "1 kg", price: 85, image: ["/images/products/fortune-rozana-basmati-rice.jpg", "/images/products/fortune-rozana-basmati-rice-2.jpg", "/images/products/fortune-rozana-basmati-rice-3.jpg"] },
      { name: "Tata Salt, Vacuum Evaporated", unit: "1 kg", price: 28, image: ["/images/products/tata-salt-vacuum-evaporated.jpg", "/images/products/tata-salt-vacuum-evaporated-2.jpg", "/images/products/tata-salt-vacuum-evaporated-3.jpg"] },
      { name: "India Gate Basmati Rice Classic", unit: "1 kg", price: 210, image: ["/images/products/india-gate-basmati.jpg", "/images/products/india-gate-basmati-2.jpg", "/images/products/india-gate-basmati-3.jpg"] },
      { name: "India Gate Basmati Rice Classic", unit: "5 kg", price: 1020, image: ["/images/products/india-gate-basmati.jpg", "/images/products/india-gate-basmati-2.jpg", "/images/products/india-gate-basmati-3.jpg"] },
      { name: "Patanjali Whole Wheat Atta", unit: "5 kg", price: 210, image: ["/images/products/patanjali-atta.jpg", "/images/products/patanjali-atta-2.jpg", "/images/products/patanjali-atta-3.jpg"] },
      { name: "Tata Sampann Toor Dal", unit: "500 g", price: 85, image: ["/images/products/tata-sampann-toor-dal.jpg", "/images/products/tata-sampann-toor-dal-2.jpg", "/images/products/tata-sampann-toor-dal-3.jpg"] },
      { name: "Tata Sampann Toor Dal", unit: "1 kg", price: 165, image: ["/images/products/tata-sampann-toor-dal.jpg", "/images/products/tata-sampann-toor-dal-2.jpg", "/images/products/tata-sampann-toor-dal-3.jpg"] }
    ],
    "Dairy, Bread & Eggs": [
      { 
        name: "Farm Fresh White Eggs", 
        unit: "6 pcs", 
        price: 45, 
        image: ["/images/products/variants/egg-1.jpg", "/images/products/variants/egg-2.jpg", "/images/products/variants/egg-3.jpg"],
        description: "Farm Fresh White Eggs are rich in protein and carefully sourced from healthy hens. Perfect for breakfast or baking.",
        moreDetails: { "Shelf Life": "21 Days", "Storage": "Refrigerate upon delivery", "Type": "Non-Vegetarian" }
      },
      { 
        name: "Farm Fresh White Eggs", 
        unit: "12 pcs", 
        price: 85, 
        image: ["/images/products/variants/egg-1.jpg", "/images/products/variants/egg-2.jpg", "/images/products/variants/egg-3.jpg"],
        description: "Farm Fresh White Eggs are rich in protein and carefully sourced from healthy hens. Perfect for breakfast or baking.",
        moreDetails: { "Shelf Life": "21 Days", "Storage": "Refrigerate upon delivery", "Type": "Non-Vegetarian" }
      },
      { 
        name: "Farm Fresh White Eggs", 
        unit: "30 pcs", 
        price: 210, 
        image: ["/images/products/variants/egg-1.jpg", "/images/products/variants/egg-2.jpg", "/images/products/variants/egg-3.jpg"],
        description: "Farm Fresh White Eggs are rich in protein and carefully sourced from healthy hens. Perfect for breakfast or baking.",
        moreDetails: { "Shelf Life": "21 Days", "Storage": "Refrigerate upon delivery", "Type": "Non-Vegetarian" }
      },
      { name: "Amul Taaza Toned Fresh Milk", unit: "500 ml", price: 27, image: ["/images/products/amul-taaza-toned-fresh-milk.jpg", "/images/products/amul-taaza-toned-fresh-milk-2.jpg", "/images/products/amul-taaza-toned-fresh-milk-3.jpg"] },
      { name: "Amul Gold Full Cream Milk", unit: "500 ml", price: 33, image: ["/images/products/amul-gold-milk.jpg", "/images/products/amul-gold-milk-2.jpg", "/images/products/amul-gold-milk-3.jpg"] },
      { name: "Britannia Daily Bake Recipe White Bread", unit: "400 g", price: 40, image: ["/images/products/britannia-daily-bake-recipe-white-bread.jpg", "/images/products/britannia-daily-bake-recipe-white-bread-2.jpg", "/images/products/britannia-daily-bake-recipe-white-bread-3.jpg"] },
      { name: "English Oven Brown Bread", unit: "400 g", price: 45, image: ["/images/products/english-oven-brown-bread.jpg", "/images/products/english-oven-brown-bread-2.jpg", "/images/products/english-oven-brown-bread-3.jpg"] },
      { name: "Amul Butter - Pasteurized", unit: "100 g", price: 56, image: ["/images/products/amul-butter-pasteurized.jpg", "/images/products/amul-butter-pasteurized-2.jpg", "/images/products/amul-butter-pasteurized-3.jpg"] },
      { name: "Amul Butter - Pasteurized", unit: "500 g", price: 275, image: ["/images/products/amul-butter-pasteurized.jpg", "/images/products/amul-butter-pasteurized-2.jpg", "/images/products/amul-butter-pasteurized-3.jpg"] },
      { name: "Mother Dairy Classic Curd", unit: "400 g", price: 35, image: ["/images/products/mother-dairy-curd.jpg", "/images/products/mother-dairy-curd-2.jpg", "/images/products/mother-dairy-curd-3.jpg"] },
      { name: "Amul Cheese Slices", unit: "200 g", price: 135, image: ["/images/products/amul-cheese-slices.jpg", "/images/products/amul-cheese-slices-2.jpg", "/images/products/amul-cheese-slices-3.jpg"] },
      { name: "Gowardhan Ghee", unit: "500 ml", price: 340, image: ["/images/products/gowardhan-ghee.jpg", "/images/products/gowardhan-ghee-2.jpg", "/images/products/gowardhan-ghee-3.jpg"] },
      { name: "Gowardhan Ghee", unit: "1 L", price: 650, image: ["/images/products/gowardhan-ghee.jpg", "/images/products/gowardhan-ghee-2.jpg", "/images/products/gowardhan-ghee-3.jpg"] }
    ],
    "Fruits & Vegetables": [
      { 
        name: "Fresh Red Onion", 
        unit: "500 g", 
        price: 20, 
        image: ["/images/products/variants/onion-1.jpg", "/images/products/variants/onion-2.jpg", "/images/products/variants/onion-3.jpg"],
        description: "Freshly picked red onions, essential for Indian cooking. Rich in antioxidants and flavor.",
        moreDetails: { "Shelf Life": "14 Days", "Origin": "Nashik, India", "Category": "Vegetables" }
      },
      { 
        name: "Fresh Red Onion", 
        unit: "1 kg", 
        price: 38, 
        image: ["/images/products/variants/onion-1.jpg", "/images/products/variants/onion-2.jpg", "/images/products/variants/onion-3.jpg"],
        description: "Freshly picked red onions, essential for Indian cooking. Rich in antioxidants and flavor.",
        moreDetails: { "Shelf Life": "14 Days", "Origin": "Nashik, India", "Category": "Vegetables" }
      },
      { 
        name: "Fresh Red Onion", 
        unit: "2 kg", 
        price: 75, 
        image: ["/images/products/variants/onion-1.jpg", "/images/products/variants/onion-2.jpg", "/images/products/variants/onion-3.jpg"],
        description: "Freshly picked red onions, essential for Indian cooking. Rich in antioxidants and flavor.",
        moreDetails: { "Shelf Life": "14 Days", "Origin": "Nashik, India", "Category": "Vegetables" }
      },
      { name: "Fresh Tomato", unit: "500 g", price: 25, image: ["/images/products/fresh-tomato.jpg", "/images/products/fresh-tomato-2.jpg", "/images/products/fresh-tomato-3.jpg"] },
      { name: "Fresh Tomato", unit: "1 kg", price: 45, image: ["/images/products/fresh-tomato.jpg", "/images/products/fresh-tomato-2.jpg", "/images/products/fresh-tomato-3.jpg"] },
      { name: "Fresh Potato", unit: "1 kg", price: 30, image: ["/images/products/fresh-potato.jpg", "/images/products/fresh-potato-2.jpg", "/images/products/fresh-potato-3.jpg"] },
      { name: "Fresh Potato", unit: "2 kg", price: 58, image: ["/images/products/fresh-potato.jpg", "/images/products/fresh-potato-2.jpg", "/images/products/fresh-potato-3.jpg"] },
      { name: "Banana Robusta", unit: "6 pcs", price: 40, image: ["/images/products/banana-robusta.jpg", "/images/products/banana-robusta-2.jpg", "/images/products/banana-robusta-3.jpg"] },
      { name: "Banana Robusta", unit: "12 pcs", price: 75, image: ["/images/products/banana-robusta.jpg", "/images/products/banana-robusta-2.jpg", "/images/products/banana-robusta-3.jpg"] },
      { name: "Green Chilli", unit: "100 g", price: 15, image: ["/images/products/green-chilli.jpg", "/images/products/green-chilli-2.jpg", "/images/products/green-chilli-3.jpg"] },
      { name: "Green Chilli", unit: "250 g", price: 30, image: ["/images/products/green-chilli.jpg", "/images/products/green-chilli-2.jpg", "/images/products/green-chilli-3.jpg"] },
      { name: "Fresh Garlic", unit: "200 g", price: 45, image: ["/images/products/fresh-garlic.jpg", "/images/products/fresh-garlic-2.jpg", "/images/products/fresh-garlic-3.jpg"] },
      { name: "Fresh Ginger", unit: "200 g", price: 35, image: ["/images/products/fresh-ginger.jpg", "/images/products/fresh-ginger-2.jpg", "/images/products/fresh-ginger-3.jpg"] },
      { name: "Fresh Lemon", unit: "250 g", price: 25, image: ["/images/products/fresh-lemon.jpg", "/images/products/fresh-lemon-2.jpg", "/images/products/fresh-lemon-3.jpg"] }
    ],
    "Cold Drinks & Juices": [
      { name: "Coca-Cola Original Taste", unit: "750 ml", price: 40, image: ["/images/products/coca-cola-original-taste.jpg", "/images/products/coca-cola-original-taste-2.jpg", "/images/products/coca-cola-original-taste-3.jpg"] },
      { name: "Coca-Cola Original Taste", unit: "2 L", price: 90, image: ["/images/products/coca-cola-original-taste.jpg", "/images/products/coca-cola-original-taste-2.jpg", "/images/products/coca-cola-original-taste-3.jpg"] },
      { name: "Coca-Cola Original Taste", unit: "300 ml Can", price: 40, image: ["/images/products/coca-cola-original-taste.jpg", "/images/products/coca-cola-original-taste-2.jpg", "/images/products/coca-cola-original-taste-3.jpg"] },
      { name: "Real Fruit Power Mixed Fruit Juice", unit: "1 L", price: 110, image: ["/images/products/real-fruit-power-mixed-fruit-juice.jpg", "/images/products/real-fruit-power-mixed-fruit-juice-2.jpg", "/images/products/real-fruit-power-mixed-fruit-juice-3.jpg"] },
      { name: "Sprite Lemon-Lime Soft Drink", unit: "750 ml", price: 40, image: ["/images/products/sprite-lemon-lime-soft-drink.jpg", "/images/products/sprite-lemon-lime-soft-drink-2.jpg", "/images/products/sprite-lemon-lime-soft-drink-3.jpg"] },
      { name: "Sprite Lemon-Lime Soft Drink", unit: "2 L", price: 90, image: ["/images/products/sprite-lemon-lime-soft-drink.jpg", "/images/products/sprite-lemon-lime-soft-drink-2.jpg", "/images/products/sprite-lemon-lime-soft-drink-3.jpg"] },
      { name: "Pepsi Soft Drink", unit: "750 ml", price: 40, image: ["/images/products/pepsi.jpg", "/images/products/pepsi-2.jpg", "/images/products/pepsi-3.jpg"] },
      { name: "Thumbs Up", unit: "750 ml", price: 40, image: ["/images/products/thumbs-up.jpg", "/images/products/thumbs-up-2.jpg", "/images/products/thumbs-up-3.jpg"] },
      { name: "Red Bull Energy Drink", unit: "250 ml", price: 125, image: ["/images/products/red-bull.jpg", "/images/products/red-bull-2.jpg", "/images/products/red-bull-3.jpg"] },
      { name: "Tropicana 100% Orange Juice", unit: "1 L", price: 120, image: ["/images/products/tropicana.jpg", "/images/products/tropicana-2.jpg", "/images/products/tropicana-3.jpg"] },
      { name: "Frooti Mango Drink", unit: "1.2 L", price: 65, image: ["/images/products/frooti.jpg", "/images/products/frooti-2.jpg", "/images/products/frooti-3.jpg"] }
    ],
    "Snacks & Munchies": [
      { name: "Lay's India's Magic Masala Potato Chips", unit: "50 g", price: 20, image: ["/images/products/lay-s-india-s-magic-masala-potato-chips.jpg", "/images/products/lay-s-india-s-magic-masala-potato-chips-2.jpg", "/images/products/lay-s-india-s-magic-masala-potato-chips-3.jpg"] },
      { name: "Lay's India's Magic Masala Potato Chips", unit: "90 g", price: 35, image: ["/images/products/lay-s-india-s-magic-masala-potato-chips.jpg", "/images/products/lay-s-india-s-magic-masala-potato-chips-2.jpg", "/images/products/lay-s-india-s-magic-masala-potato-chips-3.jpg"] },
      { name: "Haldiram's Bhujia Sev", unit: "200 g", price: 55, image: ["/images/products/haldiram-s-bhujia-sev.jpg", "/images/products/haldiram-s-bhujia-sev-2.jpg", "/images/products/haldiram-s-bhujia-sev-3.jpg"] },
      { name: "Haldiram's Bhujia Sev", unit: "400 g", price: 105, image: ["/images/products/haldiram-s-bhujia-sev.jpg", "/images/products/haldiram-s-bhujia-sev-2.jpg", "/images/products/haldiram-s-bhujia-sev-3.jpg"] },
      { name: "Haldiram's Bhujia Sev", unit: "1 kg", price: 240, image: ["/images/products/haldiram-s-bhujia-sev.jpg", "/images/products/haldiram-s-bhujia-sev-2.jpg", "/images/products/haldiram-s-bhujia-sev-3.jpg"] },
      { name: "Doritos Nacho Cheese", unit: "60 g", price: 30, image: ["/images/products/doritos.jpg", "/images/products/doritos-2.jpg", "/images/products/doritos-3.jpg"] },
      { name: "Doritos Nacho Cheese", unit: "150 g", price: 80, image: ["/images/products/doritos.jpg", "/images/products/doritos-2.jpg", "/images/products/doritos-3.jpg"] },
      { name: "Kurkure Masala Munch", unit: "90 g", price: 30, image: ["/images/products/kurkure.jpg", "/images/products/kurkure-2.jpg", "/images/products/kurkure-3.jpg"] },
      { name: "Bingo! Mad Angles", unit: "90 g", price: 30, image: ["/images/products/bingo-mad-angles.jpg", "/images/products/bingo-mad-angles-2.jpg", "/images/products/bingo-mad-angles-3.jpg"] },
      { name: "Oreo Original Choco Creme", unit: "120 g", price: 30, image: ["/images/products/oreo.jpg", "/images/products/oreo-2.jpg", "/images/products/oreo-3.jpg"] },
      { name: "Parle-G Gold Biscuits", unit: "1 kg", price: 80, image: ["/images/products/parle-g.jpg", "/images/products/parle-g-2.jpg", "/images/products/parle-g-3.jpg"] },
      { name: "Britannia Good Day Cashew", unit: "250 g", price: 45, image: ["/images/products/good-day-cashew.jpg", "/images/products/good-day-cashew-2.jpg", "/images/products/good-day-cashew-3.jpg"] }
    ],
    "Poker & Party": [
      { name: "Copag 100% Plastic Playing Cards Jumbo Index", unit: "1 pack", price: 799, image: ["/images/products/copag-cards.jpg", "/images/products/copag-cards-2.jpg", "/images/products/copag-cards-3.jpg"] },
      { name: "300 Piece Poker Chip Set with Case", unit: "1 set", price: 2499, image: ["/images/products/poker-chips-300.jpg", "/images/products/poker-chips-300-2.jpg", "/images/products/poker-chips-300-3.jpg"] },
      { name: "500 Piece Poker Chip Set with Case", unit: "1 set", price: 3499, image: ["/images/products/poker-chips-300.jpg", "/images/products/poker-chips-300-2.jpg", "/images/products/poker-chips-300-3.jpg"] },
      { name: "UNO Card Game", unit: "1 pack", price: 149, image: ["/images/products/uno-cards.jpg", "/images/products/uno-cards-2.jpg", "/images/products/uno-cards-3.jpg"] },
      { name: "Party Popper", unit: "1 pc", price: 99, image: ["/images/products/party-popper.jpg", "/images/products/party-popper-2.jpg", "/images/products/party-popper-3.jpg"] },
      { name: "Paper Cups", unit: "Pack of 50", price: 120, image: ["/images/products/paper-cups.jpg", "/images/products/paper-cups-2.jpg", "/images/products/paper-cups-3.jpg"] },
      { name: "Birthday Candles", unit: "Pack of 24", price: 40, image: ["/images/products/birthday-candles.jpg", "/images/products/birthday-candles-2.jpg", "/images/products/birthday-candles-3.jpg"] },
      { name: "Balloon Pack (Multicolor)", unit: "Pack of 100", price: 150, image: ["/images/products/balloons.jpg", "/images/products/balloons-2.jpg", "/images/products/balloons-3.jpg"] }
    ],
    "Gym & Training": [
      { name: "Hex Dumbbell", unit: "5 kg", price: 899, image: ["/images/products/dumbbell-5kg.jpg", "/images/products/dumbbell-5kg-2.jpg", "/images/products/dumbbell-5kg-3.jpg"] },
      { name: "Hex Dumbbell", unit: "10 kg", price: 1699, image: ["/images/products/dumbbell-5kg.jpg", "/images/products/dumbbell-5kg-2.jpg", "/images/products/dumbbell-5kg-3.jpg"] },
      { name: "Hex Dumbbell", unit: "2.5 kg", price: 499, image: ["/images/products/dumbbell-5kg.jpg", "/images/products/dumbbell-5kg-2.jpg", "/images/products/dumbbell-5kg-3.jpg"] },
      { name: "Optimum Nutrition Gold Standard 100% Whey Protein Double Rich Chocolate", unit: "2 lbs", price: 3299, image: ["/images/products/on-whey-protein.jpg", "/images/products/on-whey-protein-2.jpg", "/images/products/on-whey-protein-3.jpg"] },
      { name: "Optimum Nutrition Gold Standard 100% Whey Protein Double Rich Chocolate", unit: "5 lbs", price: 7299, image: ["/images/products/on-whey-protein.jpg", "/images/products/on-whey-protein-2.jpg", "/images/products/on-whey-protein-3.jpg"] },
      { name: "Yoga Mat Blue", unit: "1 pc", price: 499, image: ["/images/products/yoga-mat.jpg", "/images/products/yoga-mat-2.jpg", "/images/products/yoga-mat-3.jpg"] },
      { name: "Skipping Rope", unit: "1 pc", price: 299, image: ["/images/products/skipping-rope.jpg", "/images/products/skipping-rope-2.jpg", "/images/products/skipping-rope-3.jpg"] },
      { name: "Protein Shaker Bottle", unit: "500 ml", price: 199, image: ["/images/products/protein-shaker.jpg", "/images/products/protein-shaker-2.jpg", "/images/products/protein-shaker-3.jpg"] },
      { name: "Push-up Bars", unit: "1 pair", price: 399, image: ["/images/products/push-up-bars.jpg", "/images/products/push-up-bars-2.jpg", "/images/products/push-up-bars-3.jpg"] },
      { name: "Resistance Bands", unit: "Set of 3", price: 599, image: ["/images/products/resistance-bands.jpg", "/images/products/resistance-bands-2.jpg", "/images/products/resistance-bands-3.jpg"] }
    ],
    "Electronics": [
      { name: "Apple iPhone 15 Blue", unit: "128 GB", price: 79900, image: ["/images/products/iphone-15.jpg", "/images/products/iphone-15-2.jpg", "/images/products/iphone-15-3.jpg"] },
      { name: "Apple iPhone 15 Blue", unit: "256 GB", price: 89900, image: ["/images/products/iphone-15.jpg", "/images/products/iphone-15-2.jpg", "/images/products/iphone-15-3.jpg"] },
      { name: "Apple AirPods Pro 2nd Gen", unit: "1 unit", price: 24900, image: ["/images/products/airpods-pro.jpg", "/images/products/airpods-pro-2.jpg", "/images/products/airpods-pro-3.jpg"] },
      { name: "Samsung Galaxy S24 Ultra", unit: "256 GB", price: 129900, image: ["/images/products/s24-ultra.jpg", "/images/products/s24-ultra-2.jpg", "/images/products/s24-ultra-3.jpg"] },
      { name: "OnePlus 12", unit: "256 GB", price: 64999, image: ["/images/products/oneplus-12.jpg", "/images/products/oneplus-12-2.jpg", "/images/products/oneplus-12-3.jpg"] },
      { name: "JBL Tune 720BT Wireless Headphones", unit: "1 unit", price: 4499, image: ["/images/products/jbl-tune.jpg", "/images/products/jbl-tune-2.jpg", "/images/products/jbl-tune-3.jpg"] },
      { name: "Anker Type C Charging Cable", unit: "1 pc", price: 399, image: ["/images/products/anker-type-c.jpg", "/images/products/anker-type-c-2.jpg", "/images/products/anker-type-c-3.jpg"] },
      { name: "Sony WH-1000XM5", unit: "1 unit", price: 29990, image: ["/images/products/sony-xm5.jpg", "/images/products/sony-xm5-2.jpg", "/images/products/sony-xm5-3.jpg"] }
    ],
    "Toys & Games": [
      { name: "Hot Wheels Diecast Car", unit: "1 pc", price: 149, image: ["/images/products/hot-wheels.jpg", "/images/products/hot-wheels-2.jpg", "/images/products/hot-wheels-3.jpg"] },
      { name: "Hot Wheels Diecast Car", unit: "Pack of 5", price: 699, image: ["/images/products/hot-wheels.jpg", "/images/products/hot-wheels-2.jpg", "/images/products/hot-wheels-3.jpg"] },
      { name: "LEGO Classic Creative Bricks", unit: "1 box", price: 1999, image: ["/images/products/lego-classic.jpg", "/images/products/lego-classic-2.jpg", "/images/products/lego-classic-3.jpg"] },
      { name: "Monopoly Board Game Classic", unit: "1 box", price: 999, image: ["/images/products/monopoly.jpg", "/images/products/monopoly-2.jpg", "/images/products/monopoly-3.jpg"] },
      { name: "Rubik's Cube 3x3", unit: "1 pc", price: 499, image: ["/images/products/rubiks-cube.jpg", "/images/products/rubiks-cube-2.jpg", "/images/products/rubiks-cube-3.jpg"] },
      { name: "Nerf Elite 2.0 Commander", unit: "1 pc", price: 1299, image: ["/images/products/nerf.jpg", "/images/products/nerf-2.jpg", "/images/products/nerf-3.jpg"] },
      { name: "Barbie Fashionistas Doll", unit: "1 pc", price: 799, image: ["/images/products/barbie.jpg", "/images/products/barbie-2.jpg", "/images/products/barbie-3.jpg"] },
      { name: "Jenga Classic Game", unit: "1 box", price: 899, image: ["/images/products/jenga.jpg", "/images/products/jenga-2.jpg", "/images/products/jenga-3.jpg"] }
    ],
    "Beauty & Personal Care": [
      { name: "Nivea Body Lotion Extra Whitening", unit: "400 ml", price: 399, image: ["/images/products/nivea-lotion.jpg", "/images/products/nivea-lotion-2.jpg", "/images/products/nivea-lotion-3.jpg"] },
      { name: "Nivea Body Lotion Extra Whitening", unit: "200 ml", price: 220, image: ["/images/products/nivea-lotion.jpg", "/images/products/nivea-lotion-2.jpg", "/images/products/nivea-lotion-3.jpg"] },
      { name: "Dove Cream Beauty Bathing Bar", unit: "100 g", price: 54, image: ["/images/products/dove-soap.jpg", "/images/products/dove-soap-2.jpg", "/images/products/dove-soap-3.jpg"] },
      { name: "Dove Cream Beauty Bathing Bar", unit: "3 x 100g", price: 150, image: ["/images/products/dove-soap.jpg", "/images/products/dove-soap-2.jpg", "/images/products/dove-soap-3.jpg"] },
      { name: "L'Oreal Paris Total Repair 5 Shampoo", unit: "396 ml", price: 299, image: ["/images/products/loreal-shampoo.jpg", "/images/products/loreal-shampoo-2.jpg", "/images/products/loreal-shampoo-3.jpg"] },
      { name: "L'Oreal Paris Total Repair 5 Shampoo", unit: "175 ml", price: 155, image: ["/images/products/loreal-shampoo.jpg", "/images/products/loreal-shampoo-2.jpg", "/images/products/loreal-shampoo-3.jpg"] },
      { name: "Gillette Mach3 Men's Razor", unit: "1 pc", price: 299, image: ["/images/products/gillette.jpg", "/images/products/gillette-2.jpg", "/images/products/gillette-3.jpg"] },
      { name: "Colgate Strong Teeth Toothpaste", unit: "100 g", price: 62, image: ["/images/products/colgate.jpg", "/images/products/colgate-2.jpg", "/images/products/colgate-3.jpg"] },
      { name: "Himalaya Purifying Neem Face Wash", unit: "150 ml", price: 170, image: ["/images/products/himalaya-facewash.jpg", "/images/products/himalaya-facewash-2.jpg", "/images/products/himalaya-facewash-3.jpg"] },
      { name: "Vaseline Intensive Care Lotion", unit: "400 ml", price: 345, image: ["/images/products/vaseline.jpg", "/images/products/vaseline-2.jpg", "/images/products/vaseline-3.jpg"] }
    ],
    "Stationery & Office": [
      { name: "Classmate Long Notebook", unit: "1 pc", price: 60, image: ["/images/products/classmate-notebook.jpg", "/images/products/classmate-notebook-2.jpg", "/images/products/classmate-notebook-3.jpg"] },
      { name: "Classmate Long Notebook", unit: "Pack of 6", price: 350, image: ["/images/products/classmate-notebook.jpg", "/images/products/classmate-notebook-2.jpg", "/images/products/classmate-notebook-3.jpg"] },
      { name: "Reynolds Trimax Liquid Gel Pen Blue", unit: "1 pc", price: 50, image: ["/images/products/reynolds-trimax.jpg", "/images/products/reynolds-trimax-2.jpg", "/images/products/reynolds-trimax-3.jpg"] },
      { name: "Reynolds Trimax Liquid Gel Pen Blue", unit: "Pack of 5", price: 230, image: ["/images/products/reynolds-trimax.jpg", "/images/products/reynolds-trimax-2.jpg", "/images/products/reynolds-trimax-3.jpg"] },
      { name: "Apsara Platinum Extra Dark Pencils", unit: "10 pcs", price: 50, image: ["/images/products/apsara-pencils.jpg", "/images/products/apsara-pencils-2.jpg", "/images/products/apsara-pencils-3.jpg"] },
      { name: "Fevistik Glue", unit: "15 g", price: 25, image: ["/images/products/fevistik.jpg", "/images/products/fevistik-2.jpg", "/images/products/fevistik-3.jpg"] },
      { name: "Camel Wax Crayons", unit: "12 Shades", price: 20, image: ["/images/products/camel-crayons.jpg", "/images/products/camel-crayons-2.jpg", "/images/products/camel-crayons-3.jpg"] },
      { name: "Cello Gripper Pen", unit: "Pack of 5", price: 50, image: ["/images/products/cello-gripper.jpg", "/images/products/cello-gripper-2.jpg", "/images/products/cello-gripper-3.jpg"] },
      { name: "Post-it Sticky Notes", unit: "1 Pad", price: 80, image: ["/images/products/sticky-notes.jpg", "/images/products/sticky-notes-2.jpg", "/images/products/sticky-notes-3.jpg"] }
    ]
  };

  await Product.deleteMany({});
  await Category.deleteMany({});
  await SubCategory.deleteMany({});

  for (const catData of categories) {
    const category = await Category.findOneAndUpdate(
      { slug: toSlug(catData.name) },
      { name: catData.name, slug: toSlug(catData.name), image: catData.image },
      { upsert: true, new: true }
    );

    const sub = await SubCategory.findOneAndUpdate(
      { slug: `${toSlug(catData.name)}-popular` },
      { name: `${catData.name} Popular`, slug: `${toSlug(catData.name)}-popular`, category: [category._id], image: "" },
      { upsert: true, new: true }
    );

    const productsForCat = realisticProducts[catData.name] || [];
    let itemsToInsert = [];

    productsForCat.forEach((p, idx) => {
      itemsToInsert.push({
        name: p.name,
        slug: `${toSlug(p.name)}-${toSlug(p.unit)}-${Date.now()}-${idx}`,
        image: Array.isArray(p.image) ? p.image : [p.image],
        category: [category._id],
        subCategory: [sub._id],
        unit: p.unit,
        stock: 100,
        price: p.price,
        discount: 0,
        description: p.description || `Fresh and original ${p.name}`,
        moreDetails: p.moreDetails || {},
        isPublished: true
      });
    });

    if (itemsToInsert.length > 0) {
      await Product.insertMany(itemsToInsert);
    }
  }

  console.log("Seed complete. Admin:", adminEmail, "password: Admin@123");
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
