import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { authenticate } from '../../common/guards/auth.guard';
import { sendSuccess, sendError } from '../../common/helpers';
import { validateRequestSafe, RegisterSchema, LoginSchema, UpdateProfileSchema } from '../../common/validators';
import { decryptBody } from '../../common/middleware/decryptBody';

const router = Router();
const authService = new AuthService();

// POST /api/auth/register
router.post('/register', decryptBody('name', 'email', 'password', 'phone'), async (req: Request, res: Response) => {
  const validation = validateRequestSafe(RegisterSchema, req.body);
  
  if (!validation.success) {
    const errors = validation.error.issues.map(issue => issue.message).join(', ');
    return sendError(res, errors);
  }

  const { name, email, password, phone } = validation.data;

  try {
    const result = await authService.register({ name, email, password, phone });
    return sendSuccess(res, result, 'Registro exitoso', 201);
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

// POST /api/auth/login
router.post('/login', decryptBody('email', 'password'), async (req: Request, res: Response) => {
  const validation = validateRequestSafe(LoginSchema, req.body);
  
  if (!validation.success) {
    const errors = validation.error.issues.map(issue => issue.message).join(', ');
    return sendError(res, errors);
  }

  const { email, password } = validation.data;

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
  const validation = validateRequestSafe(UpdateProfileSchema, req.body);
  
  if (!validation.success) {
    const errors = validation.error.issues.map(issue => issue.message).join(', ');
    return sendError(res, errors);
  }

  try {
    const user = await authService.updateProfile(req.user!.sub, validation.data);
    return sendSuccess(res, user, 'Perfil actualizado');
  } catch (error) {
    return sendError(res, (error as Error).message);
  }
});

export default router;
