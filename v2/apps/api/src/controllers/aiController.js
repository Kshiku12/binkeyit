import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

export const processChat = async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;

    if (!message) return res.status(400).json({ success: false, message: "Message is required" });

    const lowerMsg = message.toLowerCase();
    let response = "";
    let products = [];

    // Helper to find products
    const findProducts = async (terms, isBudget = false) => {
      let query = Product.find({
        isPublished: true,
        $or: terms.map(t => ({ name: { $regex: t, $options: "i" } }))
      });
      
      if (isBudget) {
        query = query.sort({ price: 1 });
      }
      
      return await query.limit(10);
    };

    const isBudget = lowerMsg.includes("budget") || lowerMsg.includes("cheap") || lowerMsg.includes("low price");

    // 1. Universal Recipe Handler
    const recipeMap = {
      "pasta": ["pasta", "cheese", "tomato", "sauce", "garlic", "oil"],
      "omelette": ["egg", "onion", "chilli", "bread", "milk", "butter"],
      "tea": ["milk", "tea powder", "sugar", "ginger", "cardamom"],
      "coffee": ["milk", "coffee powder", "sugar", "biscuits"],
      "sandwich": ["bread", "cheese", "butter", "cucumber", "tomato"],
      "maggi": ["maggi", "noodles", "peas", "carrot", "butter"],
      "cake": ["maida", "sugar", "butter", "egg", "baking powder", "vanilla essence", "dark chocolate", "cocoa powder"],
      "pancakes": ["maida", "egg", "honey", "milk", "butter"],
      "salad": ["cucumber", "tomato", "onion", "lemon", "corn"]
    };

    const foundRecipe = Object.keys(recipeMap).find(r => lowerMsg.includes(r));
    
    if (foundRecipe || lowerMsg.includes("recipe") || lowerMsg.includes("cook") || lowerMsg.includes("make")) {
      const target = foundRecipe || lowerMsg.replace(/recipe|cook|make|how|to|for|me|a|some/g, "").trim().split(" ")[0];
      const ingredients = recipeMap[target] || [target, "milk", "bread", "sugar"];
      
      products = await findProducts(ingredients, isBudget);
      
      if (products.length > 0) {
        const total = products.reduce((sum, p) => sum + (p.price - Math.ceil((p.price * (p.discount || 0)) / 100)), 0);
        
        if (lowerMsg.includes("price") || lowerMsg.includes("breakdown") || lowerMsg.includes("cost") || lowerMsg.includes("how much")) {
          const breakdown = products.map(p => `${p.name}: ₹${p.price - Math.ceil((p.price * (p.discount || 0)) / 100)}`).join("\n");
          response = `Here is the price breakdown for your ${target} ingredients:\n\n${breakdown}\n\n**Grand Total: ₹${total}**\n\nI've selected the best items for you!`;
        } else {
          response = isBudget 
            ? `I've found the most budget-friendly ingredients for your ${target || "recipe"}. Best value guaranteed!`
            : `I've put together a complete shopping list for your ${target || "recipe"}. Everything you need is listed below:`;
        }
      } else {
        response = `I'm ready to help you make ${target}! I couldn't find specific ingredients in stock right now, but you can browse our fresh sections.`;
      }
    }
    // 2. Handle specific product requests (show/find/buy)
    else if (lowerMsg.includes("show") || lowerMsg.includes("find") || lowerMsg.includes("buy")) {
      const searchTerms = lowerMsg.replace(/show|find|buy|me|some|the|products/g, "").trim().split(" ");
      products = await findProducts(searchTerms.filter(t => t.length > 2));
      if (products.length > 0) {
        response = `Here are the best ${searchTerms.join(" ")} products I found for you:`;
      } else {
        response = "I couldn't find those specific products, but I can help you with anything else!";
      }
    }
    // 3. Handle Order Queries
    else if (lowerMsg.includes("order") || lowerMsg.includes("status") || lowerMsg.includes("track") || lowerMsg.includes("where")) {
      const orders = await Order.find({ customerId: user._id }).sort({ createdAt: -1 }).limit(1);
      if (orders.length === 0) {
        response = "I couldn't find any recent orders. You can start shopping by browsing our fresh 'Fruits & Vegetables' or 'Dairy' sections!";
      } else {
        const order = orders[0];
        const status = order.orderStatus.replace(/_/g, " ");
        response = `Your latest order #${order.orderCode} is currently ${status}. It's arriving in about ${order.etaMinutes || 15} minutes. I've personally made sure our best rider is on it!`;
      }
    } 
    // 4. Handle Wallet Queries
    else if (lowerMsg.includes("wallet") || lowerMsg.includes("money") || lowerMsg.includes("balance") || lowerMsg.includes("pay")) {
      response = `You have ₹${user.walletBalance?.toLocaleString() || "0"} in your Binkeyit Wallet. It's the fastest way to pay and get instant refunds!`;
    }
    // 5. Handle Specific Product Categories
    else if (lowerMsg.includes("milk") || lowerMsg.includes("dairy") || lowerMsg.includes("egg")) {
      response = "Our Dairy section features farm-fresh Milk, Organic Eggs, and Premium Butter. They are all delivered within 10 minutes!";
      products = await findProducts(["milk", "egg", "butter", "cheese"]);
    }
    // 6. Handle Returns/Refunds
    else if (lowerMsg.includes("return") || lowerMsg.includes("refund") || lowerMsg.includes("wrong") || lowerMsg.includes("bad")) {
      response = "I'm sorry about the trouble. Since we prioritize freshness, if any item is not up to the mark, you can get an instant refund to your wallet from the 'Order History' section.";
    }
    // 7. Handle Greetings
    else if (lowerMsg.includes("hi") || lowerMsg.includes("hello") || lowerMsg.includes("hey") || lowerMsg.includes("who")) {
      response = `Hi ${user.name.split(" ")[0]}! I'm your Binkeyit AI Assistant. I'm trained to help you find ingredients for recipes (like cakes!), track your live orders, or manage your wallet. What's on your mind?`;
    }
    // Fallback
    else {
      response = "I'm still learning about that! But I'm an expert on Binkeyit's products, your order status, and wallet balance. Is there something specific about your shopping list I can help with?";
    }

    return res.json({ success: true, data: { response, products } });

  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({ success: false, message: "AI is currently optimizing its neural networks. Please try again in a few seconds!" });
  }
};
