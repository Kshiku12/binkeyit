import { verifyAccessToken } from "../utils/token.js";
import { User } from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id).select("-password -refreshToken");
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
};
