import { Router, Request, Response } from 'express';
import { AddressService } from './address.service';
import { authenticate } from '../../common/guards/auth.guard';
import { sendSuccess, sendError } from '../../common/helpers';

const router = Router();
const addressService = new AddressService();

// All routes require authentication
router.use(authenticate);

// GET /api/addresses — list user's addresses
router.get('/', async (req: Request, res: Response) => {
  try {
    const addresses = await addressService.findByUser(req.user!.sub);
    return sendSuccess(res, addresses);
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// POST /api/addresses — create address
router.post('/', async (req: Request, res: Response) => {
  const { label, address, is_default } = req.body;

  if (!address || !address.trim()) {
    return sendError(res, 'La dirección es requerida');
  }

  try {
    const created = await addressService.create(
      req.user!.sub,
      label?.trim() || 'Mi dirección',
      address.trim(),
      is_default === true || is_default === 'true'
    );
    return sendSuccess(res, created, 'Dirección guardada', 201);
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// PATCH /api/addresses/:id/default — set as default
router.patch('/:id/default', async (req: Request, res: Response) => {
  try {
    const address = await addressService.setDefault(req.user!.sub, req.params.id);
    return sendSuccess(res, address, 'Dirección predeterminada actualizada');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// DELETE /api/addresses/:id — delete address
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await addressService.delete(req.user!.sub, req.params.id);
    return sendSuccess(res, null, 'Dirección eliminada');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

export default router;
