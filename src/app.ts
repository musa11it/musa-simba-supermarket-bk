import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error';

const app: Application = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
     'http://localhost:5173',
     'https://musa-simba-supermarket-fr-6o8l.vercel.app',
      
    ],
    credentials: true,
  })
);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Simba API is healthy', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

export default app;
