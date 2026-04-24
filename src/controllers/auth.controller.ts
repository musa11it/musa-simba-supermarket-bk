import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { AuthRequest } from '../types';
import emailService from '../services/email.service';

const generateToken = (user: any): string => {
  const secret = process.env.JWT_SECRET || 'simba_default_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      branchId: user.branchId?.toString(),
    },
    secret,
    { expiresIn } as jwt.SignOptions
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, language } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
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
      language: language || 'en',
      role: 'customer',
    });

    const token = generateToken(user);

    // Send welcome email (non-blocking)
    emailService.sendWelcome(user.email, user.name).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user, token },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Your account has been deactivated' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, googleId, avatar } = req.body;

    if (!email || !googleId) {
      res.status(400).json({ success: false, message: 'Google credentials required' });
      return;
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user from Google
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: crypto.randomBytes(16).toString('hex'),
        googleId,
        avatar,
        role: 'customer',
      });
      emailService.sendWelcome(user.email, user.name).catch(() => {});
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      await user.save();
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Google login successful',
      data: { user, token },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Always return success to prevent email enumeration
      res.json({ success: true, message: 'If the email exists, a reset link was sent' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    emailService.sendPasswordReset(user.email, resetUrl).catch(() => {});

    res.json({
      success: true,
      message: 'Password reset link sent to your email',
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      return;
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, language, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { ...(name && { name }), ...(phone && { phone }), ...(language && { language }), ...(avatar && { avatar }) },
      { new: true }
    );
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password required' });
      return;
    }

    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
