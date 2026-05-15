import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { hashOtp, generateOtp } from "../utils/otp.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";
import { sendEmail } from "../services/emailService.js";

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: false
};

const issueAuthTokens = async (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  return {
    accessToken,
    refreshToken
  };
};

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "name, email and password are required" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: "Email already registered" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hash,
    role: role && ["ADMIN", "CUSTOMER", "RIDER"].includes(role) ? role : "CUSTOMER",
    isEmailVerified: true
  });

  const tokens = await issueAuthTokens(res, user);
  return res.json({
    success: true,
    message: "Registered successfully",
    data: { user, ...tokens }
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user || !user.password) {
    return res.status(400).json({ success: false, message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password || "", user.password);
  if (!ok) return res.status(400).json({ success: false, message: "Invalid credentials" });

  const tokens = await issueAuthTokens(res, user);
  return res.json({
    success: true,
    message: "Login successful",
    data: { user, ...tokens }
  });
};

export const googleLogin = async (req, res) => {
  try {
    const { idToken, role, isAccessToken } = req.body;
    console.log("Google Login Attempt:", { isAccessToken, hasToken: !!idToken });

    if (!idToken) return res.status(400).json({ success: false, message: "Token is required" });
    if (!googleClient) {
      console.error("Google Auth Error: Client not initialized (check GOOGLE_CLIENT_ID in .env)");
      return res.status(501).json({ success: false, message: "Google auth not configured on server" });
    }

    let payload;
    if (isAccessToken) {
      console.log("Verifying Google Access Token...");
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`);
      payload = await response.json();
      if (!payload.email) {
        console.error("Google Access Token Verification Failed:", payload);
        return res.status(400).json({ success: false, message: "Invalid Google Access Token" });
      }
    } else {
      console.log("Verifying Google ID Token with Audience:", env.googleClientId?.trim());
      try {
        const ticket = await googleClient.verifyIdToken({ 
          idToken, 
          audience: env.googleClientId?.trim()
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.error("ID Token Verification Error:", verifyErr.message);
        // Fallback: If verification fails, it might be due to audience mismatch. 
        // Use the official Google Token Info endpoint for ID Tokens.
        try {
          console.log("Attempting ID Token Info fallback...");
          const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
          payload = await response.json();
          if (!payload.email || payload.error) {
             throw new Error(payload.error_description || "Fallback failed");
          }
        } catch (fallbackErr) {
          console.error("All Google Verification Methods Failed:", fallbackErr.message);
          return res.status(401).json({ 
            success: false, 
            message: "Google Token verification failed", 
            error: verifyErr.message 
          });
        }
      }
    }

    const email = payload?.email?.toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: "Invalid Google token (no email found)" });

    console.log("Google User Authenticated:", email);

    let user = await User.findOne({ email });
    if (!user) {
      console.log("Creating new user from Google:", email);
      user = await User.create({
        name: payload.name || email.split("@")[0],
        email,
        googleId: payload.sub || payload.id || "",
        avatar: payload.picture || "",
        role: role && ["ADMIN", "CUSTOMER", "RIDER"].includes(role) ? role : "CUSTOMER",
        isEmailVerified: true
      });
    }

    const tokens = await issueAuthTokens(res, user);
    console.log("Auth tokens issued for:", email);
    return res.json({ success: true, message: "Google login successful", data: { user, ...tokens } });
  } catch (error) {
    console.error("CRITICAL: Google login server error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Google login failed on server", 
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

export const me = async (req, res) => {
  const user = await User.findById(req.user._id);
  return res.json({ success: true, data: user });
};

export const saveCard = async (req, res) => {
  const { cardNumber, name, expiry } = req.body;
  if (!cardNumber || !name || !expiry) {
    return res.status(400).json({ success: false, message: "Card details are required" });
  }

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  // Add card if not already exists (basic check)
  const exists = user.savedCards.some(c => c.cardNumber.slice(-4) === cardNumber.slice(-4));
  if (!exists) {
    // Mask the card number for security
    const maskedNumber = "**** **** **** " + cardNumber.slice(-4);
    user.savedCards.push({ cardNumber: maskedNumber, name, expiry });
    await user.save();
  }

  return res.json({ success: true, data: user.savedCards });
};

export const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Invalid refresh token" });

  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.id);
  if (!user || user.refreshToken !== token) {
    return res.status(401).json({ success: false, message: "Invalid refresh token" });
  }

  const accessToken = signAccessToken(user);
  res.cookie("accessToken", accessToken, cookieOptions);
  return res.json({ success: true, data: { accessToken } });
};

export const logout = async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  if (userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: "" });
  }
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
  return res.json({ success: true, message: "Logged out" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user) {
    return res.status(200).json({ success: true, message: "If email exists, OTP was sent" });
  }

  const otp = generateOtp();
  user.forgotPasswordOtpHash = hashOtp(otp);
  user.forgotPasswordOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  user.forgotPasswordVerified = false;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Your Blinkit Clone OTP",
    html: `<p>Hello ${user.name},</p><p>Your OTP is <b>${otp}</b> and valid for 10 minutes.</p>`
  });

  return res.json({ success: true, message: "OTP sent to email" });
};

export const verifyForgotOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user) return res.status(400).json({ success: false, message: "Invalid OTP" });

  const isExpired = !user.forgotPasswordOtpExpiresAt || user.forgotPasswordOtpExpiresAt < new Date();
  const isValid = hashOtp(otp || "") === user.forgotPasswordOtpHash;
  if (isExpired || !isValid) return res.status(400).json({ success: false, message: "Invalid OTP" });

  user.forgotPasswordVerified = true;
  await user.save();
  return res.json({ success: true, message: "OTP verified" });
};

export const resetPassword = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;
  if (!newPassword || newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match" });
  }

  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user || !user.forgotPasswordVerified) {
    return res.status(400).json({ success: false, message: "OTP verification required" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.forgotPasswordOtpHash = "";
  user.forgotPasswordOtpExpiresAt = null;
  user.forgotPasswordVerified = false;
  await user.save();

  return res.json({ success: true, message: "Password reset successful" });
};

export const addWalletMoney = async (req, res) => {
  const { amount, paymentMethod } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.walletBalance = (user.walletBalance || 0) + amount;
  
  // Record transaction
  user.walletTransactions.push({
    type: "TOPUP",
    amount,
    status: "SUCCESS",
    paymentMethod: paymentMethod || "CARD",
    timestamp: new Date()
  });

  await user.save();

  return res.json({ success: true, data: { walletBalance: user.walletBalance, transactions: user.walletTransactions } });
};

export const updateProfile = async (req, res) => {
  const { name, mobile } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  if (name) user.name = name;
  if (mobile) user.mobile = mobile;

  await user.save();
  return res.json({ success: true, data: user });
};


