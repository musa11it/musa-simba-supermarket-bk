import { Response } from 'express';
import Inventory from '../models/Inventory';
import { AuthRequest } from '../types';

export const getBranchInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branchId = req.params.branchId || req.user!.branchId;
    const inventory = await Inventory.find({ branchId }).populate('productId').sort({ createdAt: -1 });
    res.json({ success: true, data: inventory });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, branchId, stock } = req.body;

    const inventory = await Inventory.findOneAndUpdate(
      { productId, branchId },
      { stock, isOutOfStock: stock <= 0 },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Stock updated', data: inventory });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markOutOfStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { stock: 0, isOutOfStock: true },
      { new: true }
    );
    res.json({ success: true, message: 'Marked as out of stock', data: inventory });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLowStockAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branchId = req.user!.branchId;
    const items = await Inventory.find({
      branchId,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }).populate('productId');
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
