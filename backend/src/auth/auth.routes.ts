import { Router } from 'express';
import { register, login } from './auth.controller';
import { authRequired, roleRequired } from './auth.middleware';

const router = Router();

router.post('/register', authRequired, roleRequired(['admin']), register);
router.post('/login', login);

export default router;
