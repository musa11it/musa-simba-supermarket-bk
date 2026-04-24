import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../types';

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    nameRw: { type: String, required: true, trim: true },
    nameFr: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    descriptionRw: { type: String, default: '' },
    descriptionFr: { type: String, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'piece' },
    image: { type: String, required: true },
    images: [{ type: String }],
    brand: { type: String },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema);
export default Product;
