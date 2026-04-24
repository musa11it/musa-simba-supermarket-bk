import { Request } from 'express';
import { Document, Types } from 'mongoose';

export type UserRole = 'superadmin' | 'admin' | 'staff' | 'customer';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type Language = 'en' | 'rw' | 'fr';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  branchId?: Types.ObjectId;
  language: Language;
  isActive: boolean;
  noShowCount: number;
  avatar?: string;
  googleId?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface IBranch extends Document {
  name: string;
  nameRw: string;
  nameFr: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  managerIds: Types.ObjectId[];
  staffIds: Types.ObjectId[];
  isActive: boolean;
  openingHours: string;
  averageRating: number;
  totalReviews: number;
  pendingApproval: boolean;
  createdBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  name: string;
  nameRw: string;
  nameFr: string;
  slug: string;
  icon: string;
  image?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

export interface IProduct extends Document {
  name: string;
  nameRw: string;
  nameFr: string;
  description: string;
  descriptionRw: string;
  descriptionFr: string;
  categoryId: Types.ObjectId;
  price: number;
  unit: string;
  image: string;
  images: string[];
  brand?: string;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventory extends Document {
  productId: Types.ObjectId;
  branchId: Types.ObjectId;
  stock: number;
  lowStockThreshold: number;
  isOutOfStock: boolean;
  updatedAt: Date;
}

export interface ICartItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId: Types.ObjectId;
  branchId: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  depositAmount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentConfirmed: boolean;
  pickupTime: Date;
  assignedStaffId?: Types.ObjectId;
  acceptedBy?: Types.ObjectId;
  acceptedAt?: Date;
  completedAt?: Date;
  cancelledReason?: string;
  customerNote?: string;
  noShowFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview extends Document {
  customerId: Types.ObjectId;
  branchId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'order' | 'system' | 'approval' | 'promo';
  relatedId?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    branchId?: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
