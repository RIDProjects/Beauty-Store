import { Router, Request, Response } from 'express';
import { CategoryService } from './category.service';
import { authenticate, authorize } from '../../common/guards/auth.guard';
import { sendSuccess, sendError } from '../../common/helpers';

const router = Router();
const categoryService = new CategoryService();

// GET /api/categories - Public
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await categoryService.findAll(true);
    return sendSuccess(res, categories);
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// GET /api/categories/admin - Admin only (includes inactive)
router.get('/admin', authenticate, authorize('admin'), async (_req: Request, res: Response) => {
  try {
    const categories = await categoryService.findAll(false);
    return sendSuccess(res, categories);
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// POST /api/categories - Admin only
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  const { name, description, image_url } = req.body;

  if (!name) return sendError(res, 'El nombre es requerido');

  try {
    const category = await categoryService.create({ name, description, image_url });
    return sendSuccess(res, category, 'Categoría creada', 201);
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// PUT /api/categories/:id - Admin only
router.put('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const category = await categoryService.update(req.params.id, req.body);
    return sendSuccess(res, category, 'Categoría actualizada');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// PATCH /api/categories/:id/toggle - Admin only
router.patch('/:id/toggle', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const category = await categoryService.toggleActive(req.params.id);
    return sendSuccess(res, category, 'Estado actualizado');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// DELETE /api/categories/:id - Admin only
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    await categoryService.delete(req.params.id);
    return sendSuccess(res, null, 'Categoría eliminada');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

export default router;
