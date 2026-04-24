import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../types';

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'piece' },
    image: { type: String },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    depositAmount: { type: Number, default: 500 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentConfirmed: { type: Boolean, default: false },
    pickupTime: { type: Date, required: true },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'User' },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    cancelledReason: { type: String },
    customerNote: { type: String },
    noShowFlagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Generate unique order number before save
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    (this as any).orderNumber = `SMB-${timestamp}-${random}`;
  }
  next();
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
export default Order;
