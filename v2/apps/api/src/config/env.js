import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const env = {
  port: Number(process.env.PORT || 8081),
  mongoUri: process.env.MONGODB_URI || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5174",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "",
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "Blinkit v2 <no-reply@localhost>",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  merchantUpiId: process.env.MERCHANT_UPI_ID || "",
  merchantUpiQrUrl: process.env.MERCHANT_UPI_QR_URL || ""
};

export const validateEnv = () => {
  const missing = [];
  if (!env.mongoUri) missing.push("MONGODB_URI");
  if (!env.jwtAccessSecret) missing.push("JWT_ACCESS_SECRET");
  if (!env.jwtRefreshSecret) missing.push("JWT_REFRESH_SECRET");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
};
