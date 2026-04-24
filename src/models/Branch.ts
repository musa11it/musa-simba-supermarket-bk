import mongoose, { Schema } from 'mongoose';
import { IBranch } from '../types';

const branchSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameRw: { type: String, required: true, trim: true },
    nameFr: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    phone: { type: String, required: true },
    managerIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    staffIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    openingHours: { type: String, default: '8:00 AM - 10:00 PM' },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    pendingApproval: { type: Boolean, default: false },
    rejectionReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);
export default Branch;
