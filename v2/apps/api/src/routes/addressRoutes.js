import express from "express";
import { getAddresses, addAddress } from "../controllers/addressController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.route("/")
  .get(requireAuth, getAddresses)
  .post(requireAuth, addAddress);

export const addressRoutes = router;
