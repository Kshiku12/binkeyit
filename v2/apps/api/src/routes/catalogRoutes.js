import { Router } from "express";
import {
  createCategory,
  createProduct,
  createSubCategory,
  getHomeCatalog,
  listByCategory,
  listByCategoryAndSubCategory,
  listProducts
} from "../controllers/catalogController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const catalogRoutes = Router();

catalogRoutes.get("/home", getHomeCatalog);
catalogRoutes.post("/products/list", listProducts);
catalogRoutes.post("/products/by-category", listByCategory);
catalogRoutes.post("/products/by-category-subcategory", listByCategoryAndSubCategory);

catalogRoutes.post("/categories", requireAuth, requireRole("ADMIN"), createCategory);
catalogRoutes.post("/subcategories", requireAuth, requireRole("ADMIN"), createSubCategory);
catalogRoutes.post("/products", requireAuth, requireRole("ADMIN"), createProduct);
