import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, default: "" },
    googleId: { type: String, default: "" },
    avatar: { type: String, default: "" },
    mobile: { type: String, default: "" },
    role: { type: String, enum: ["ADMIN", "CUSTOMER", "RIDER"], default: "CUSTOMER" },
    isEmailVerified: { type: Boolean, default: false },
    forgotPasswordOtpHash: { type: String, default: "" },
    forgotPasswordOtpExpiresAt: { type: Date, default: null },
    forgotPasswordVerified: { type: Boolean, default: false },
    refreshToken: { type: String, default: "" },
    walletBalance: { type: Number, default: 500 }, // Default balance for testing
    userRating: { type: Number, default: 5.0 },
    savedCards: {
      type: [
        {
          cardNumber: String,
          name: String,
          expiry: String
        }
      ],
      default: []
    },
    walletTransactions: [
      {
        type: { type: String, enum: ["TOPUP", "PURCHASE", "REFUND"], default: "TOPUP" },
        amount: { type: Number, required: true },
        status: { type: String, enum: ["SUCCESS", "FAILED", "PENDING"], default: "SUCCESS" },
        paymentMethod: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const User = mongoose.model("UserV2", userSchema);
