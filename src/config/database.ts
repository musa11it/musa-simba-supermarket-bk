import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/simba_supermarket';
    
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Don't exit - allow server to start for demo purposes
    console.log('⚠️  Server will run without database. Install MongoDB for full functionality.');
  }
};

export default connectDB;
