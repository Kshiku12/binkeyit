import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, index: true },
    image: { type: String, default: "" },
    category: [{ type: mongoose.Schema.Types.ObjectId, ref: "CategoryV2", required: true }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const SubCategory = mongoose.model("SubCategoryV2", subCategorySchema);
