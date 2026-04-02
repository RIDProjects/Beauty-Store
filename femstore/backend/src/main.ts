import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ─── Validación de variables de entorno ────────────────────────────────────
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error(`❌ ERROR: Variables de entorno requeridas faltantes: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  ADVERTENCIA: JWT_SECRET no definido. Usando valor por defecto (NO usar en producción)');
}

// Route imports
import authRoutes from './modules/auth/auth.controller';
import categoryRoutes from './modules/categories/category.controller';
import productRoutes from './modules/products/product.controller';
import orderRoutes from './modules/orders/order.controller';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security & Middleware ────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow any localhost
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
      return;
    }

    // Allow any Vercel deployment (any *.vercel.app)
    if (origin && (origin.endsWith('.vercel.app') || origin.endsWith('.vercel.sh'))) {
      callback(null, true);
      return;
    }

    // Allow specific configured origins
    const allowedOrigins = [
      'https://www.vainybliss.com/',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // In development, allow everything
    if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP por ventana
  message: { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

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
