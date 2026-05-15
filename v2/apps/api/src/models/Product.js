import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    image: [{ type: String, default: [] }],
    category: [{ type: mongoose.Schema.Types.ObjectId, ref: "CategoryV2", required: true }],
    subCategory: [{ type: mongoose.Schema.Types.ObjectId, ref: "SubCategoryV2", required: true }],
    unit: { type: String, required: true },
    stock: { type: Number, default: 0 },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    description: { type: String, default: "" },
    moreDetails: { type: Object, default: {} },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

export const Product = mongoose.model("ProductV2", productSchema);
