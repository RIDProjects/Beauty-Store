import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { authenticate } from '../../common/guards/auth.guard';
import { sendSuccess, sendError } from '../../common/helpers';

const router = Router();
const authService = new AuthService();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return sendError(res, 'Nombre, email y contraseña son requeridos');
  }

  if (password.length < 6) {
    return sendError(res, 'La contraseña debe tener al menos 6 caracteres');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 'Email inválido');
  }

  try {
    const result = await authService.register({ name, email, password, phone });
    return sendSuccess(res, result, 'Registro exitoso', 201);
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Email y contraseña son requeridos');
  }

  try {
    const result = await authService.login({ email, password });
    return sendSuccess(res, result, 'Login exitoso');
  } catch (error) {
    return sendError(res, (error as Error).message, 401);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await authService.getProfile(req.user!.sub);
    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, (error as Error).message, 404);
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  const { name, phone } = req.body;

  try {
    const user = await authService.updateProfile(req.user!.sub, { name, phone });
    return sendSuccess(res, user, 'Perfil actualizado');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

export default router;
