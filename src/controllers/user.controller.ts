import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search, page = '1', limit = '20' } = req.query;
    const query: any = {};
    if (role) query.role = role;
    if (search) {
      const regex = new RegExp(search as string, 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [users, total] = await Promise.all([
      User.find(query).skip((pageNum - 1) * limitNum).limit(limitNum).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).populate('branchId', 'name');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role, branchId } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, message: 'All fields required' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role,
      branchId,
    });

    res.status(201).json({ success: true, message: 'User created', data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    if (password) {
      user.password = password;
      await user.save();
    }
    res.json({ success: true, message: 'User updated', data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: user.isActive ? 'Activated' : 'Deactivated', data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBranchStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branchId = req.params.branchId || req.user!.branchId;
    const staff = await User.find({ branchId, role: { $in: ['staff', 'admin'] } });
    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalCustomers, totalAdmins, totalStaff, activeUsers] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'staff' }),
      User.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      data: { totalCustomers, totalAdmins, totalStaff, activeUsers },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
