import { CartItem } from "../models/CartItem.js";

export const getCart = async (req, res) => {
  const items = await CartItem.find({ userId: req.user._id }).populate("productId").sort({ createdAt: -1 });
  
  // Cleanup orphaned items (products that were deleted)
  const validItems = items.filter(item => item.productId != null);
  const orphanedIds = items.filter(item => item.productId == null).map(item => item._id);
  
  if (orphanedIds.length > 0) {
    await CartItem.deleteMany({ _id: { $in: orphanedIds } });
  }

  return res.json({ success: true, data: validItems });
};

export const addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: "productId is required" });

  const updated = await CartItem.findOneAndUpdate(
    { userId: req.user._id, productId },
    { $set: { quantity: Math.max(1, Number(quantity) || 1) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return res.json({ success: true, data: updated });
};

export const updateCartQty = async (req, res) => {
  const { itemId, quantity } = req.body;
  if (!itemId || !quantity) return res.status(400).json({ success: false, message: "itemId and quantity required" });
  const updated = await CartItem.findOneAndUpdate(
    { _id: itemId, userId: req.user._id },
    { $set: { quantity: Math.max(1, Number(quantity)) } },
    { new: true }
  );
  return res.json({ success: true, data: updated });
};

export const removeCartItem = async (req, res) => {
  const { itemId } = req.body;
  await CartItem.deleteOne({ _id: itemId, userId: req.user._id });
  return res.json({ success: true, message: "Removed" });
};
