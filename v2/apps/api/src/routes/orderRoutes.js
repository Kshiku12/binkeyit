import { Router } from "express";
import {
  getOrderDetails,
  listMyOrders,
  listRiderOrders,
  placeOrder,
  updateOrderStatus,
  rateOrder
} from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const orderRoutes = Router();

orderRoutes.use(requireAuth);
orderRoutes.post("/", requireRole("CUSTOMER", "ADMIN"), placeOrder);
orderRoutes.get("/mine", requireRole("CUSTOMER", "ADMIN"), listMyOrders);
orderRoutes.get("/rider/assigned", requireRole("RIDER"), listRiderOrders);
orderRoutes.get("/:orderId", getOrderDetails);
orderRoutes.patch("/:orderId/status", requireRole("ADMIN", "RIDER", "CUSTOMER"), updateOrderStatus);
orderRoutes.post("/:orderId/rate", requireRole("CUSTOMER", "ADMIN"), rateOrder);
