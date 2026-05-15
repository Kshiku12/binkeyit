import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserV2", required: true, index: true },
    addressType: { type: String, enum: ["Home", "Office", "Hotel", "Other"], default: "Home" },
    apartment: { type: String, required: true },
    building: { type: String, required: true },
    baseAddress: { type: String, required: true },
    lat: { type: Number, default: 12.9716 }, // Default Bengaluru
    lng: { type: Number, default: 77.5946 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Address = mongoose.model("AddressV2", addressSchema);
