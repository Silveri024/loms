import { Router } from 'express';
import { authRequired, roleRequired } from '../auth/auth.middleware';
import { getUsers, createUser, updateUser, deleteUser } from './user.controller';

const router = Router();

router.use(authRequired, roleRequired(['admin']));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
