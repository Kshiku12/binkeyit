import Stripe from "stripe";
import { env } from "../config/env.js";

let stripe = null;
if (env.stripeSecretKey) {
  stripe = new Stripe(env.stripeSecretKey);
}

export const createCardPaymentIntent = async ({ amountInRupees, orderCode }) => {
  if (!stripe) {
    return {
      provider: "MOCK_STRIPE",
      clientSecret: `mock_client_secret_${orderCode}`,
      paymentReference: `mock_pi_${orderCode}`
    };
  }

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amountInRupees * 100),
    currency: "inr",
    metadata: { orderCode }
  });

  return {
    provider: "STRIPE",
    clientSecret: intent.client_secret,
    paymentReference: intent.id
  };
};

export const createUpiPayment = ({ orderCode }) => {
  const upiDeepLink = env.merchantUpiId
    ? `upi://pay?pa=${encodeURIComponent(env.merchantUpiId)}&pn=Blinkit%20Clone&tn=${encodeURIComponent(
        orderCode
      )}`
    : "";

  return {
    provider: "UPI",
    upiDeepLink,
    merchantUpiQrUrl: env.merchantUpiQrUrl || "",
    paymentReference: `upi_${orderCode}`
  };
};
