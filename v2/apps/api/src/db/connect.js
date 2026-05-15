import mongoose from "mongoose";
import { env } from "../config/env.js";

export const connectDb = async (retries = 5) => {
  while (retries) {
    try {
      console.log(`Connecting to MongoDB... (Attempts left: ${retries})`);
      await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      console.log("✅ MongoDB Connected Successfully");
      return mongoose.connection;
    } catch (err) {
      console.error("❌ MongoDB Connection Error:", err.message);
      retries -= 1;
      if (retries === 0) throw err;
      console.log("Retrying in 5 seconds...");
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};
