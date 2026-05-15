import { Router } from "express";
import {
  forgotPassword,
  googleLogin,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
  verifyForgotOtp,
  saveCard,
  addWalletMoney,
  updateProfile
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/google", googleLogin);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/verify-forgot-otp", verifyForgotOtp);
authRoutes.post("/reset-password", resetPassword);
authRoutes.post("/refresh", refresh);
authRoutes.get("/me", requireAuth, me);
authRoutes.post("/cards", requireAuth, saveCard);
authRoutes.post("/logout", requireAuth, logout);
authRoutes.post("/wallet/add", requireAuth, addWalletMoney);
authRoutes.patch("/profile", requireAuth, updateProfile);
