import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'staff', 'customer'],
      default: 'customer',
    },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    language: { type: String, enum: ['en', 'rw', 'fr'], default: 'en' },
    isActive: { type: Boolean, default: true },
    noShowCount: { type: Number, default: 0 },
    avatar: { type: String },
    googleId: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  (this as any).password = await bcrypt.hash((this as any).password, salt);
  next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

export const User = mongoose.model<IUser>('User', userSchema);
export default User;
