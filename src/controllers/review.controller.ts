import { Response } from 'express';
import Review from '../models/Review';
import Branch from '../models/Branch';
import Order from '../models/Order';
import { AuthRequest } from '../types';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, rating, comment } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    if (order.customerId.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not your order' });
      return;
    }
    if (order.status !== 'completed') {
      res.status(400).json({ success: false, message: 'Can only review completed orders' });
      return;
    }

    const review = await Review.create({
      customerId: req.user!.id,
      branchId: order.branchId,
      orderId,
      rating,
      comment,
    });

    // Update branch average rating
    const allReviews = await Review.find({ branchId: order.branchId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Branch.findByIdAndUpdate(order.branchId, {
      averageRating: avg,
      totalReviews: allReviews.length,
    });

    res.status(201).json({ success: true, message: 'Review submitted', data: review });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'You already reviewed this order' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getBranchReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find({ branchId: req.params.branchId })
      .populate('customerId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
