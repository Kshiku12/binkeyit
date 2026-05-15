import { Address } from "../models/Address.js";

// @desc    Get user addresses
// @route   GET /api/v2/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Server error while fetching addresses." });
  }
};

// @desc    Add a new address
// @route   POST /api/v2/addresses
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const { addressType, apartment, building, baseAddress, isDefault } = req.body;

    if (!apartment || !building || !baseAddress) {
      return res.status(400).json({ message: "Please provide all required address fields." });
    }

    // Check if this is the user's first address
    const existingCount = await Address.countDocuments({ userId: req.user._id, isActive: true });
    
    // If they want to set this as default, or it's their first address
    const shouldBeDefault = isDefault || existingCount === 0;

    if (shouldBeDefault && existingCount > 0) {
      // Unset default on other addresses
      await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    }

    const address = new Address({
      userId: req.user._id,
      addressType: addressType || "Home",
      apartment,
      building,
      baseAddress,
      isDefault: shouldBeDefault
    });

    const savedAddress = await address.save();
    res.status(201).json(savedAddress);
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ message: "Server error while saving address." });
  }
};
