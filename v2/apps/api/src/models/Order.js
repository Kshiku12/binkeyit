import mongoose from "mongoose";

const trackingEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductV2", required: true },
    name: { type: String, required: true },
    image: { type: [String], default: [] },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "UserV2", required: true, index: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "UserV2", default: null, index: true },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: "AddressV2", required: true },
    items: { type: [orderItemSchema], default: [] },
    paymentMethod: { type: String, enum: ["CARD", "COD", "UPI", "WALLET"], required: true },
    paymentStatus: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },
    orderStatus: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
      default: "PLACED"
    },
    paymentReference: { type: String, default: "" },
    upiId: { type: String, default: "" },
    merchantUpiQrUrl: { type: String, default: "" },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    etaMinutes: { type: Number, default: 15 },
    estimatedDeliveryAt: { type: Date },
    tracking: { type: [trackingEventSchema], default: [] },
    riderRating: { type: Number, default: 0 },
    orderRating: { type: Number, default: 0 },
    isRated: { type: Boolean, default: false },
    startLat: { type: Number },
    startLng: { type: Number },
    destLat: { type: Number },
    destLng: { type: Number }
  },
  { timestamps: true }
);

export const Order = mongoose.model("OrderV2", orderSchema);
