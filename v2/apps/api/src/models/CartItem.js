import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserV2", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductV2", required: true },
    quantity: { type: Number, default: 1, min: 1 }
  },
  { timestamps: true }
);

cartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const CartItem = mongoose.model("CartItemV2", cartItemSchema);
