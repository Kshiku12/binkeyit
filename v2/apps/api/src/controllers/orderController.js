import mongoose from "mongoose";
import { Address } from "../models/Address.js";
import { CartItem } from "../models/CartItem.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { createCardPaymentIntent, createUpiPayment } from "../services/paymentService.js";
import { emitOrderTracking } from "../services/socketService.js";
import { discountedPrice } from "../utils/pricing.js";

const buildOrderItems = (cartItems) =>
  cartItems.map((row) => {
    const product = row.productId;
    return {
      productId: product._id,
      name: product.name,
      image: product.image,
      unitPrice: discountedPrice(product.price, product.discount),
      quantity: row.quantity
    };
  });

const calcTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryFee = subtotal > 499 ? 0 : 25;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
};

const buildOrderCode = () => `ORD-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;

export const placeOrder = async (req, res) => {
  const { addressId, paymentMethod, upiId = "" } = req.body;
  if (!addressId || !paymentMethod) {
    return res.status(400).json({ success: false, message: "addressId and paymentMethod are required" });
  }
  if (!["CARD", "COD", "UPI", "WALLET"].includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: "Invalid payment method" });
  }

  const [address, cartItems, user] = await Promise.all([
    Address.findOne({ _id: addressId, userId: req.user._id, isActive: true }),
    CartItem.find({ userId: req.user._id }).populate("productId"),
    User.findById(req.user._id)
  ]);

  if (!address) return res.status(400).json({ success: false, message: "Invalid address" });
  if (!cartItems.length) return res.status(400).json({ success: false, message: "Cart is empty" });

  const items = buildOrderItems(cartItems);
  const { subtotal, deliveryFee, total } = calcTotals(items);
  const orderCode = buildOrderCode();

  // Wallet check
  if (paymentMethod === "WALLET") {
    if ((user.walletBalance || 0) < total) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }
    user.walletBalance -= total;
    await user.save();
  }

  const firstRider = await User.findOne({ role: "RIDER" }).sort({ createdAt: 1 });

  const destLat = address.lat || 12.9716;
  const destLng = address.lng || 77.5946;
  // Start rider ~1.2km away from destination
  const startLat = destLat + (Math.random() > 0.5 ? 0.008 : -0.008);
  const startLng = destLng + (Math.random() > 0.5 ? 0.008 : -0.008);

  const order = await Order.create({
    orderCode,
    customerId: req.user._id,
    riderId: firstRider?._id || null,
    addressId: address._id,
    items,
    paymentMethod,
    paymentStatus: paymentMethod === "WALLET" ? "PAID" : "PENDING",
    subtotal,
    deliveryFee,
    total,
    upiId,
    destLat,
    destLng,
    startLat,
    startLng,
    estimatedDeliveryAt: new Date(Date.now() + 15 * 60 * 1000),
    tracking: [{ status: "PLACED", note: "Order placed successfully" }]
  });

  let paymentData = {};
  if (paymentMethod === "CARD") {
    paymentData = await createCardPaymentIntent({ amountInRupees: total, orderCode });
    order.paymentReference = paymentData.paymentReference || "";
    await order.save();
  }

  if (paymentMethod === "UPI") {
    paymentData = createUpiPayment({ orderCode });
    order.paymentReference = paymentData.paymentReference || "";
    order.merchantUpiQrUrl = paymentData.merchantUpiQrUrl || "";
    await order.save();
  }

  await CartItem.deleteMany({ userId: req.user._id });

  emitOrderTracking(order._id.toString(), {
    orderId: order._id,
    orderStatus: order.orderStatus,
    tracking: order.tracking,
    etaMinutes: order.etaMinutes
  });

  // START SIMULATION (Only for demo/testing)
  const simulateStatus = (status, delay) => {
    setTimeout(async () => {
      const currentOrder = await Order.findById(order._id);
      if (!currentOrder || currentOrder.orderStatus === "CANCELLED" || currentOrder.orderStatus === "DELIVERED") return;

      currentOrder.orderStatus = status;
      let note = "";
      if (status === "CONFIRMED") note = "Your order has been confirmed by the store";
      if (status === "PACKED") note = "Items are packed and ready to ship";
      if (status === "OUT_FOR_DELIVERY") {
        note = "Rider has picked up your order";
        currentOrder.etaMinutes = 12;
      }
      if (status === "DELIVERED") {
        note = "Order delivered successfully";
        currentOrder.etaMinutes = 0;
        currentOrder.paymentStatus = currentOrder.paymentMethod === "COD" ? "PAID" : currentOrder.paymentStatus;
      }

      currentOrder.tracking.push({ status, note, at: new Date() });
      await currentOrder.save();

      emitOrderTracking(currentOrder._id.toString(), {
        orderId: currentOrder._id,
        orderStatus: currentOrder.orderStatus,
        tracking: currentOrder.tracking,
        etaMinutes: currentOrder.etaMinutes,
        rider: status === "OUT_FOR_DELIVERY" ? firstRider : null
      });

      // Simulation of movement
      if (status === "OUT_FOR_DELIVERY") {
        const start = { lat: currentOrder.startLat || 12.9716, lng: currentOrder.startLng || 77.5946 };
        const end = { lat: currentOrder.destLat || 12.9716, lng: currentOrder.destLng || 77.5946 };
        
        let totalTimeSeconds = 15 * 60; // 15 Minutes
        let updateIntervalSeconds = 2; 
        let steps = totalTimeSeconds / updateIntervalSeconds;
        let currentStep = 0;

        const moveInterval = setInterval(async () => {
          if (currentStep > steps) {
            clearInterval(moveInterval);
            return;
          }
          const lat = start.lat + (end.lat - start.lat) * (currentStep / steps);
          const lng = start.lng + (end.lng - start.lng) * (currentStep / steps);
          
          console.log(`[Order ${currentOrder._id}] Simulating Step ${currentStep}/${steps}: ${lat}, ${lng}`);
          
          emitOrderTracking(currentOrder._id.toString(), {
            location: { lat, lng },
            isLive: true
          });
          currentStep++;
        }, updateIntervalSeconds * 1000); 
      }
    }, delay);
  };

  simulateStatus("CONFIRMED", 5000); // 5 secs
  simulateStatus("PACKED", 15000);    // 15 secs
  simulateStatus("OUT_FOR_DELIVERY", 30000); // 30 mins
  simulateStatus("DELIVERED", 15 * 60 * 1000 + 30000); // 15 mins after OFD

  return res.json({
    success: true,
    message: "Order placed",
    data: {
      order,
      payment: paymentData,
      walletBalance: user.walletBalance
    }
  });
};

export const listMyOrders = async (req, res) => {
  const orders = await Order.find({ customerId: req.user._id })
    .populate("addressId riderId", "name mobile addressLine city state pincode")
    .sort({ createdAt: -1 });
  return res.json({ success: true, data: orders });
};

export const listRiderOrders = async (req, res) => {
  const orders = await Order.find({ riderId: req.user._id, orderStatus: { $in: ["CONFIRMED", "PACKED", "OUT_FOR_DELIVERY"] } })
    .populate("customerId addressId", "name mobile addressLine city state pincode")
    .sort({ createdAt: -1 });
  return res.json({ success: true, data: orders });
};

export const getOrderDetails = async (req, res) => {
  const { orderId } = req.params;
  console.log("Fetching order:", orderId, "for user:", req.user._id, "role:", req.user.role);
  const query =
    req.user.role === "ADMIN"
      ? { _id: orderId }
      : req.user.role === "RIDER"
      ? { _id: orderId, riderId: req.user._id }
      : { _id: orderId, customerId: req.user._id };

  const order = await Order.findOne(query).populate("addressId customerId riderId", "name email mobile addressLine city state pincode");
  if (!order) {
    console.log("Order not found or access denied for query:", query);
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  return res.json({ success: true, data: order });
};

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, note = "" } = req.body;
  const allowed = ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

  const filter =
    req.user.role === "ADMIN" 
      ? { _id: orderId } 
      : req.user.role === "RIDER" 
      ? { _id: orderId, riderId: req.user._id }
      : { _id: orderId, customerId: req.user._id };

  if (!filter) return res.status(403).json({ success: false, message: "Forbidden" });

  const order = await Order.findOne(filter);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  order.orderStatus = status;
  if (status === "DELIVERED") {
    order.paymentStatus = order.paymentMethod === "COD" ? "PAID" : order.paymentStatus;
    order.etaMinutes = 0;
  } else if (status === "OUT_FOR_DELIVERY") {
    order.etaMinutes = 12;
  }

  order.tracking.push({ status, note, at: new Date() });
  await order.save();

  emitOrderTracking(order._id.toString(), {
    orderId: order._id,
    orderStatus: order.orderStatus,
    tracking: order.tracking,
    etaMinutes: order.etaMinutes
  });

  return res.json({ success: true, data: order });
};
export const rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { riderRating, orderRating } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.riderRating = riderRating;
    order.orderRating = orderRating;
    order.isRated = true;
    await order.save();

    res.json({ success: true, message: "Rating saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
