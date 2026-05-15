import { Category } from "../models/Category.js";
import { SubCategory } from "../models/SubCategory.js";
import { Product } from "../models/Product.js";
import { toSlug } from "../utils/slug.js";

const normalizeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : value ? [value] : []);

export const getHomeCatalog = async (req, res) => {
  const [categories, subCategories] = await Promise.all([
    Category.find({ isActive: true }).sort({ name: 1 }),
    SubCategory.find({ isActive: true }).populate("category").sort({ name: 1 })
  ]);

  const firstSections = await Promise.all(
    categories.slice(0, 10).map(async (category) => {
      const items = await Product.find({ isPublished: true, category: { $in: [category._id] } })
        .limit(12)
        .sort({ createdAt: -1 });
      return {
        category,
        items
      };
    })
  );

  return res.json({
    success: true,
    data: {
      banner: {
        title: "Electronics Store",
        subtitle: "Your favourite iPhone now delivered in minutes",
        image: "http://localhost:8081/assets/electronics_banner.png"
      },
      categories,
      subCategories,
      sections: firstSections
    }
  });
};

export const createCategory = async (req, res) => {
  const { name, image = "" } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "name is required" });
  const category = await Category.create({ name, image, slug: toSlug(name) });
  return res.json({ success: true, data: category });
};

export const createSubCategory = async (req, res) => {
  const { name, image = "", category } = req.body;
  const categoryIds = normalizeArray(category);
  if (!name || !categoryIds.length) {
    return res.status(400).json({ success: false, message: "name and category are required" });
  }
  const subCategory = await SubCategory.create({ name, image, slug: toSlug(name), category: categoryIds });
  return res.json({ success: true, data: subCategory });
};

export const createProduct = async (req, res) => {
  const { name, image = [], category, subCategory, unit, stock = 0, price, discount = 0, description = "", moreDetails = {} } =
    req.body;
  const categoryIds = normalizeArray(category);
  const subCategoryIds = normalizeArray(subCategory);

  if (!name || !categoryIds.length || !subCategoryIds.length || !unit || Number(price) <= 0) {
    return res.status(400).json({ success: false, message: "Missing required product fields" });
  }

  const product = await Product.create({
    name,
    slug: `${toSlug(name)}-${Date.now()}`,
    image,
    category: categoryIds,
    subCategory: subCategoryIds,
    unit,
    stock,
    price,
    discount,
    description,
    moreDetails
  });
  return res.json({ success: true, data: product });
};

export const listProducts = async (req, res) => {
  let { page = 1, limit = 20, search = "" } = req.body || {};
  page = Number(page) || 1;
  limit = Number(limit) || 20;

  const query = search
    ? {
        $or: [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
      }
    : {};

  const [items, total] = await Promise.all([
    Product.find({ ...query, isPublished: true })
      .populate("category subCategory")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments({ ...query, isPublished: true })
  ]);

  return res.json({
    success: true,
    data: items,
    page,
    total,
    totalPages: Math.ceil(total / limit)
  });
};

export const listByCategory = async (req, res) => {
  const categoryIds = normalizeArray(req.body?.categoryId || req.body?.id);
  if (!categoryIds.length) {
    return res.status(400).json({ success: false, message: "categoryId is required" });
  }
  const products = await Product.find({ isPublished: true, category: { $in: categoryIds } }).limit(20);
  return res.json({ success: true, data: products });
};

export const listByCategoryAndSubCategory = async (req, res) => {
  const categoryIds = normalizeArray(req.body?.categoryId);
  const subCategoryIds = normalizeArray(req.body?.subCategoryId);
  let { page = 1, limit = 20 } = req.body || {};
  page = Number(page) || 1;
  limit = Number(limit) || 20;

  if (!categoryIds.length || !subCategoryIds.length) {
    return res.status(400).json({ success: false, message: "categoryId and subCategoryId are required" });
  }

  const query = {
    isPublished: true,
    category: { $in: categoryIds },
    subCategory: { $in: subCategoryIds }
  };

  const [items, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query)
  ]);

  return res.json({ success: true, data: items, page, total, totalPages: Math.ceil(total / limit) });
};
