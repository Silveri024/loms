import { Router } from 'express';
import { authRequired, roleRequired } from '../auth/auth.middleware';
import { listRoles, createRole, updateRole, deleteRole } from './role.controller';

const router = Router();

router.use(authRequired, roleRequired(['admin']));

router.get('/', listRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;
