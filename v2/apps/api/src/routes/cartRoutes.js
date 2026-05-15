import { Router } from "express";
import { addToCart, getCart, removeCartItem, updateCartQty } from "../controllers/cartController.js";
import { requireAuth } from "../middleware/auth.js";

export const cartRoutes = Router();

cartRoutes.use(requireAuth);
cartRoutes.get("/", getCart);
cartRoutes.post("/", addToCart);
cartRoutes.put("/", updateCartQty);
cartRoutes.delete("/", removeCartItem);
