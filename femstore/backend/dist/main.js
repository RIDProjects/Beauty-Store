"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
const auth_controller_1 = __importDefault(require("./modules/auth/auth.controller"));
const category_controller_1 = __importDefault(require("./modules/categories/category.controller"));
const product_controller_1 = __importDefault(require("./modules/products/product.controller"));
const order_controller_1 = __importDefault(require("./modules/orders/order.controller"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// ─── Security & Middleware ────────────────────────────────────
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const corsOptions = {
    origin: (origin, callback) => {
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
        // Allow specific configured origins (with and without www, with and without trailing slash)
        const allowedOrigins = [
            'https://www.vainybliss.com',
            'https://vainybliss.com',
            process.env.FRONTEND_URL,
        ].filter((origin) => typeof origin === 'string' && origin.length > 0);
        // Normalize origin for comparison (remove trailing slash)
        const normalizedOrigin = origin?.replace(/\/$/, '');
        if (normalizedOrigin && allowedOrigins.some(allowed => allowed.replace(/\/$/, '') === normalizedOrigin)) {
            callback(null, true);
            return;
        }
        // In development, allow everything
        if (process.env.NODE_ENV !== 'production') {
            callback(null, true);
            return;
        }
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use((0, cors_1.default)(corsOptions));
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ─── Rate Limiting ─────────────────────────────────────────────────────────
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP por ventana
    message: { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// ─── Static Files (uploaded images) ───────────────────────────
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), uploadDir)));
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
app.use('/api/auth', auth_controller_1.default);
app.use('/api/categories', category_controller_1.default);
app.use('/api/products', product_controller_1.default);
app.use('/api/orders', order_controller_1.default);
// ─── 404 Handler ─────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});
// ─── Global Error Handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
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
exports.default = app;
//# sourceMappingURL=main.js.map