import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) return null;
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass }
  });
  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();
  if (!transport) {
    console.log("[email skipped] missing SMTP config", { to, subject });
    return;
  }
  await transport.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    html
  });
};
