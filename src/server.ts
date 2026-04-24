import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   🛒  SIMBA SUPERMARKET API v2.0          ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║   🚀 Server running on port ${PORT}          ║`);
    console.log(`║   🌍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(22)}   ║`);
    console.log(`║   📡 URL: http://localhost:${PORT}            ║`);
    console.log('║   🔑 Ready to accept requests             ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
