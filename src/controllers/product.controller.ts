import { Response } from 'express';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import { AuthRequest } from '../types';

export const getAllProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search, featured, branchId, page = '1', limit = '24' } = req.query;

    const query: any = { isActive: true };
    if (category) query.categoryId = category;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      const regex = new RegExp(search as string, 'i');
      query.$or = [{ name: regex }, { nameRw: regex }, { nameFr: regex }, { tags: regex }];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).populate('categoryId', 'name nameRw nameFr slug').skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    // If branchId supplied, attach inventory
    let productsWithStock = products;
    if (branchId) {
      const inventories = await Inventory.find({
        branchId,
        productId: { $in: products.map((p) => p._id) },
      });
      const stockMap = new Map(inventories.map((i) => [i.productId.toString(), i.stock]));
      productsWithStock = products.map((p: any) => ({
        ...p.toObject(),
        stock: stockMap.get(p._id.toString()) || 0,
      }));
    }

    res.json({
      success: true,
      data: productsWithStock,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.query;
    const product = await Product.findById(req.params.id).populate('categoryId');
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    let stock = null;
    if (branchId) {
      const inventory = await Inventory.findOne({ productId: product._id, branchId });
      stock = inventory?.stock || 0;
    }

    res.json({ success: true, data: { ...product.toObject(), stock } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product updated', data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deactivated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeaturedProducts = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('categoryId', 'name slug')
      .limit(8);
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const products = await Product.find({ isActive: true })
      .populate({ path: 'categoryId', match: { slug }, select: 'name slug' })
      .limit(24);
    const filtered = products.filter((p) => p.categoryId);
    res.json({ success: true, data: filtered });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
