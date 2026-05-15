import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { env } from "./config/env.js";
import { authRoutes } from "./routes/authRoutes.js";
import { catalogRoutes } from "./routes/catalogRoutes.js";
import { cartRoutes } from "./routes/cartRoutes.js";
import { orderRoutes } from "./routes/orderRoutes.js";
import { addressRoutes } from "./routes/addressRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export const app = express();
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

const allowedOrigins = [env.frontendUrl, "http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Blinkit v2 API is healthy" });
});

app.use("/api/v2/auth", authRoutes);
app.use("/api/v2/catalog", catalogRoutes);
app.use("/api/v2/cart", cartRoutes);
app.use("/api/v2/orders", orderRoutes);
app.use("/api/v2/addresses", addressRoutes);
app.use("/api/v2/ai", aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
