import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ProductService } from './product.service';
import { authenticate, authorize } from '../../common/guards/auth.guard';
import { sendSuccess, sendError } from '../../common/helpers';

const router = Router();
const productService = new ProductService();

// Configure multer for image uploads
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpg, png, webp)'));
    }
  },
});

// GET /api/products - Public - with filters
router.get('/', async (req: Request, res: Response) => {
  const { category_id, search, page, limit, sort } = req.query;

  try {
    const result = await productService.findAll({
      category_id: category_id as string,
      search: search as string,
      is_active: true,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 12,
      sort: sort as string,
    });

    return sendSuccess(res, result.products, undefined, 200, result.pagination);
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// GET /api/products/admin - Admin - all products including inactive
router.get('/admin', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  const { category_id, search, page, limit, is_active } = req.query;

  try {
    const result = await productService.findAll({
      category_id: category_id as string,
      search: search as string,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    return sendSuccess(res, result.products, undefined, 200, result.pagination);
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// GET /api/products/:id - Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await productService.findById(req.params.id);
    if (!product || !product.is_active) {
      return sendError(res, 'Producto no encontrado', 404);
    }
    return sendSuccess(res, product);
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// POST /api/products - Admin
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  const { name, description, price, stock, category_id, is_active } = req.body;

  if (!name || !price) {
    return sendError(res, 'Nombre y precio son requeridos');
  }

  if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
    return sendError(res, 'El precio debe ser un número positivo');
  }

  try {
    const product = await productService.create({
      name,
      description,
      price: parseFloat(price),
      stock: stock ? parseInt(stock) : 0,
      category_id,
      is_active: is_active !== undefined ? is_active === 'true' || is_active === true : true,
    });
    return sendSuccess(res, product, 'Producto creado', 201);
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// PUT /api/products/:id - Admin
router.put('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  const { name, description, price, stock, category_id, is_active } = req.body;

  try {
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (category_id !== undefined) updateData.category_id = category_id;
    if (is_active !== undefined) updateData.is_active = is_active === 'true' || is_active === true;

    const product = await productService.update(req.params.id, updateData);
    return sendSuccess(res, product, 'Producto actualizado');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// PATCH /api/products/:id/toggle - Admin
router.patch('/:id/toggle', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const product = await productService.toggleActive(req.params.id);
    return sendSuccess(res, product, 'Estado actualizado');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// DELETE /api/products/:id - Admin
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    await productService.delete(req.params.id);
    return sendSuccess(res, null, 'Producto eliminado');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// POST /api/products/:id/images - Admin - Upload image
router.post(
  '/:id/images',
  authenticate,
  authorize('admin'),
  upload.single('image'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return sendError(res, 'No se subió ninguna imagen');
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const isPrimary = req.body.is_primary === 'true';

    try {
      await productService.addImage(req.params.id, imageUrl, isPrimary);
      const product = await productService.findById(req.params.id);
      return sendSuccess(res, { url: imageUrl, product }, 'Imagen subida', 201);
    } catch (error) {
      // Clean up uploaded file on error
      fs.unlinkSync(req.file.path);
      return sendError(res, (error as Error).message);
    }
  }
);

// DELETE /api/products/:id/images/:imageId - Admin
router.delete('/:id/images/:imageId', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    await productService.removeImage(req.params.imageId);
    return sendSuccess(res, null, 'Imagen eliminada');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// PATCH /api/products/:id/images/:imageId/primary - Admin
router.patch('/:id/images/:imageId/primary', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    await productService.setPrimaryImage(req.params.id, req.params.imageId);
    return sendSuccess(res, null, 'Imagen principal actualizada');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

export default router;
