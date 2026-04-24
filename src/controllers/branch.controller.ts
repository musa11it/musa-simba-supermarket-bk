import { Response } from 'express';
import Branch from '../models/Branch';
import User from '../models/User';
import { AuthRequest } from '../types';
import emailService from '../services/email.service';

export const getAllBranches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { includeAll } = req.query;
    const query: any = { isActive: true };

    // Only superadmin sees pending approvals in normal listing, unless explicitly asked
    if (!includeAll) {
      query.pendingApproval = false;
    }

    const branches = await Branch.find(query).sort({ name: 1 });
    res.json({ success: true, data: branches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBranchById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      res.status(404).json({ success: false, message: 'Branch not found' });
      return;
    }
    res.json({ success: true, data: branch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, nameRw, nameFr, address, latitude, longitude, phone, openingHours,
    } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: 'Name, address, latitude, longitude required' });
      return;
    }

    const isSuperAdmin = req.user!.role === 'superadmin';
    
    const branch = await Branch.create({
      name,
      nameRw: nameRw || name,
      nameFr: nameFr || name,
      address,
      latitude,
      longitude,
      phone: phone || '+250 788 000 000',
      openingHours: openingHours || '8:00 AM - 10:00 PM',
      pendingApproval: !isSuperAdmin, // Only superadmin-created branches are auto-approved
      createdBy: req.user!.id,
      approvedBy: isSuperAdmin ? req.user!.id : undefined,
    });

    // Notify superadmin if created by admin
    if (!isSuperAdmin) {
      try {
        const superadmin = await User.findOne({ role: 'superadmin' });
        const admin = await User.findById(req.user!.id);
        if (superadmin && admin) {
          emailService.sendBranchApprovalRequest(superadmin.email, branch.name, admin.name).catch(() => {});
        }
      } catch (_) {}
    }

    res.status(201).json({
      success: true,
      message: isSuperAdmin
        ? 'Branch created successfully'
        : 'Branch submitted for super admin approval',
      data: branch,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      res.status(404).json({ success: false, message: 'Branch not found' });
      return;
    }

    // Only superadmin or the branch admin can edit
    if (req.user!.role !== 'superadmin' && req.user!.branchId !== req.params.id) {
      res.status(403).json({ success: false, message: 'Not authorized to edit this branch' });
      return;
    }

    const updated = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Branch updated', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!branch) {
      res.status(404).json({ success: false, message: 'Branch not found' });
      return;
    }
    res.json({ success: true, message: 'Branch deactivated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      res.status(404).json({ success: false, message: 'Branch not found' });
      return;
    }

    branch.pendingApproval = false;
    branch.approvedBy = req.user!.id as any;
    await branch.save();

    // Notify creator
    if (branch.createdBy) {
      try {
        const creator = await User.findById(branch.createdBy);
        if (creator) {
          emailService.sendBranchApproved(creator.email, branch.name).catch(() => {});
        }
      } catch (_) {}
    }

    res.json({ success: true, message: 'Branch approved', data: branch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      res.status(404).json({ success: false, message: 'Branch not found' });
      return;
    }
    res.json({ success: true, message: 'Branch request rejected and removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingBranches = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branches = await Branch.find({ pendingApproval: true }).populate('createdBy', 'name email');
    res.json({ success: true, data: branches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignManager = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      res.status(404).json({ success: false, message: 'Branch not found' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.role = 'admin';
    user.branchId = branch._id as any;
    await user.save();

    if (!branch.managerIds.includes(userId)) {
      branch.managerIds.push(userId);
      await branch.save();
    }

    res.json({ success: true, message: 'Manager assigned', data: branch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
