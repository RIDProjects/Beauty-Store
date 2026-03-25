import { Router, Request, Response } from 'express';
import { OrderService } from './order.service';
import { authenticate, authorize, optionalAuth } from '../../common/guards/auth.guard';
import { sendSuccess, sendError } from '../../common/helpers';
import { OrderStatus } from '../../common/types';

const router = Router();
const orderService = new OrderService();

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// POST /api/orders - Create order (optional auth)
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    delivery_type,
    notes,
    items,
  } = req.body;

  if (!customer_name || !customer_phone) {
    return sendError(res, 'Nombre y teléfono del cliente son requeridos');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return sendError(res, 'El carrito no puede estar vacío');
  }

  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity < 1) {
      return sendError(res, 'Datos de productos inválidos');
    }
  }

  if (delivery_type === 'delivery' && !delivery_address) {
    return sendError(res, 'La dirección es requerida para entrega a domicilio');
  }

  try {
    const order = await orderService.create({
      user_id: req.user?.sub,
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      delivery_type: delivery_type || 'pickup',
      notes,
      items,
    });

    return sendSuccess(res, order, '¡Pedido creado exitosamente!', 201);
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// GET /api/orders/my - Get current user's orders
router.get('/my', authenticate, async (req: Request, res: Response) => {
  const { page, limit, status } = req.query;

  try {
    const result = await orderService.findAll({
      user_id: req.user!.sub,
      status: status as OrderStatus,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    });

    return sendSuccess(res, result.orders, undefined, 200, result.pagination);
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// GET /api/orders/stats - Admin dashboard stats
router.get('/stats', authenticate, authorize('admin'), async (_req: Request, res: Response) => {
  try {
    const stats = await orderService.getStats();
    return sendSuccess(res, stats);
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// GET /api/orders - Admin: get all orders
router.get('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  const { page, limit, status } = req.query;

  try {
    const result = await orderService.findAll({
      status: status as OrderStatus,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    return sendSuccess(res, result.orders, undefined, 200, result.pagination);
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// GET /api/orders/:id - Get order detail
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const order = await orderService.findById(req.params.id);

    if (!order) return sendError(res, 'Orden no encontrada', 404);

    // Customers can only see their own orders
    if (req.user!.role !== 'admin' && order.user_id !== req.user!.sub) {
      return sendError(res, 'No autorizado', 403);
    }

    return sendSuccess(res, order);
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// PATCH /api/orders/:id/status - Admin: update order status
router.patch('/:id/status', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  const { status } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return sendError(res, `Estado inválido. Valores válidos: ${VALID_STATUSES.join(', ')}`);
  }

  try {
    const order = await orderService.updateStatus(req.params.id, status);
    return sendSuccess(res, order, 'Estado actualizado');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

export default router;
