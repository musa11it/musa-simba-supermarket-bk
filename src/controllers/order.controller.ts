import { Response } from 'express';
import Order from '../models/Order';
import Inventory from '../models/Inventory';
import User from '../models/User';
import Product from '../models/Product';
import { AuthRequest } from '../types';
import emailService from '../services/email.service';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, items, pickupTime, note } = req.body;

    if (!branchId || !items || !items.length || !pickupTime) {
      res.status(400).json({ success: false, message: 'Branch, items, and pickup time required' });
      return;
    }

    const productIds = items.map((i: any) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const product: any = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      subtotal += product.price * item.quantity;
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        unit: product.unit,
        image: product.image,
      };
    });

    const user = await User.findById(req.user!.id);
    const baseDeposit = parseInt(process.env.MOMO_DEPOSIT_AMOUNT || '500');
    const deposit = (user?.noShowCount || 0) >= 2 ? baseDeposit * 3 : baseDeposit;

    const order = await Order.create({
      customerId: req.user!.id,
      branchId,
      items: orderItems,
      subtotal,
      depositAmount: deposit,
      total: subtotal,
      deposit,
      pickupTime: new Date(pickupTime),
      note,
      customerNote: note,
      paymentStatus: 'pending',
      paymentConfirmed: false,
    });

    // Decrement inventory
    for (const item of items) {
      await Inventory.findOneAndUpdate(
        { productId: item.productId, branchId },
        { $inc: { stock: -item.quantity } }
      );
    }

    if (user) {
      emailService.sendOrderConfirmation(user.email, (order as any).orderNumber, subtotal).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Order created. Please complete MoMo deposit.',
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    (order as any).paymentStatus = 'paid';
    (order as any).paymentConfirmed = true;
    (order as any).status = 'accepted';
    await order.save();

    res.json({ success: true, message: 'Payment confirmed', data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ customerId: req.user!.id })
      .populate('branchId', 'name address')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('branchId')
      .populate('customerId', 'name email phone')
      .populate('assignedStaffId', 'name');
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBranchOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branchId = req.user!.role === 'superadmin' ? req.params.branchId : req.user!.branchId;
    const { status } = req.query;
    const query: any = {};
    if (branchId) query.branchId = branchId;
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('customerId', 'name email phone noShowCount')
      .populate('assignedStaffId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaffOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({
      assignedStaffId: req.user!.id,
      status: { $in: ['accepted', 'preparing', 'ready'] },
    })
      .populate('customerId', 'name phone')
      .sort({ pickupTime: 1 });
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { staffId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    (order as any).assignedStaffId = staffId;
    if ((order as any).status === 'pending') (order as any).status = 'accepted';
    (order as any).acceptedBy = req.user!.id;
    (order as any).acceptedAt = new Date();
    await order.save();

    res.json({ success: true, message: 'Order assigned', data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, cancelledReason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    (order as any).status = status;
    if (status === 'completed') (order as any).completedAt = new Date();
    if (status === 'cancelled' && cancelledReason) (order as any).cancelledReason = cancelledReason;
    if (status === 'no_show') {
      (order as any).noShowFlagged = true;
      await User.findByIdAndUpdate((order as any).customerId, { $inc: { noShowCount: 1 } });
    }

    await order.save();
    res.json({ success: true, message: 'Status updated', data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branchFilter: any = {};
    if (req.user!.role === 'admin' && req.user!.branchId) {
      branchFilter.branchId = req.user!.branchId;
    }

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const [todayOrders, pendingOrders, preparingOrders, completedToday, noShows, revenueResult] =
      await Promise.all([
        Order.countDocuments({ ...branchFilter, createdAt: { $gte: todayStart } }),
        Order.countDocuments({ ...branchFilter, status: 'pending' }),
        Order.countDocuments({ ...branchFilter, status: { $in: ['accepted', 'preparing'] } }),
        Order.countDocuments({ ...branchFilter, status: 'completed', completedAt: { $gte: todayStart } }),
        Order.countDocuments({ ...branchFilter, status: 'no_show', createdAt: { $gte: todayStart } }),
        Order.aggregate([
          { $match: { ...branchFilter, paymentStatus: 'paid', createdAt: { $gte: todayStart } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);

    res.json({
      success: true,
      data: {
        todayOrders,
        pendingOrders,
        preparingOrders,
        completedToday,
        noShows,
        revenue: revenueResult[0]?.total || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
