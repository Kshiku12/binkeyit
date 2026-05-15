import mongoose from "mongoose";
import { Order } from "../models/Order.js";

const MONGO_URI = "mongodb+srv://kshitijv2003_db_user:Ocethrokk%4012@cluster0.8v8eshg.mongodb.net/blinkit_v2?retryWrites=true&w=majority";

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all orders that are NOT Delivered or Cancelled
    const activeOrders = await Order.find({
      orderStatus: { $in: ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY"] }
    });

    console.log(`Found ${activeOrders.length} active orders.`);

    const now = new Date();
    let updatedCount = 0;

    for (const order of activeOrders) {
      const createdAt = new Date(order.createdAt);
      const diffMs = now - createdAt;
      const diffMins = diffMs / (1000 * 60);

      // If order is older than 20 minutes, mark as delivered
      if (diffMins > 20) {
        order.orderStatus = "DELIVERED";
        order.paymentStatus = "PAID";
        order.tracking.push({
          status: "DELIVERED",
          note: "Marked as delivered by system cleanup",
          at: now
        });
        await order.save();
        updatedCount++;
        console.log(`Updated Order ${order.orderCode} to DELIVERED (was ${diffMins.toFixed(1)} mins old)`);
      }
    }

    console.log(`Cleanup complete. Updated ${updatedCount} orders.`);
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

cleanup();
