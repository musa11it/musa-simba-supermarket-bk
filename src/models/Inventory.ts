import mongoose, { Schema } from 'mongoose';
import { IInventory } from '../types';

const inventorySchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    isOutOfStock: { type: Boolean, default: false },
  },
  { timestamps: true }
);

inventorySchema.index({ productId: 1, branchId: 1 }, { unique: true });

inventorySchema.pre('save', function (next) {
  (this as any).isOutOfStock = (this as any).stock <= 0;
  next();
});

export const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);
export default Inventory;
