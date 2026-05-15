import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, email: user.email }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpires
  });

export const signRefreshToken = (user) =>
  jwt.sign({ id: user._id }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpires });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
