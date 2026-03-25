import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Route imports
import authRoutes from './modules/auth/auth.controller';
import categoryRoutes from './modules/categories/category.controller';
import productRoutes from './modules/products/product.controller';
import orderRoutes from './modules/orders/order.controller';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security & Middleware ────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files (uploaded images) ───────────────────────────
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(process.cwd(), uploadDir)));

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'FemStore API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
  });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║        🌸  FemStore API  🌸           ║
╠═══════════════════════════════════════╣
║  Status:  Running                     ║
║  Port:    ${PORT}                        ║
║  Env:     ${process.env.NODE_ENV || 'development'}             ║
║  Health:  http://localhost:${PORT}/health ║
╚═══════════════════════════════════════╝
  `);
});

export default app;
