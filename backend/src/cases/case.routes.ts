import { Router } from 'express';
import { getAllCases, getCaseById, createCase, updateCase, deleteCase, getCaseAccess, upsertCaseAccess, revokeCaseAccess } from './case.controller';
import { authRequired } from '../auth/auth.middleware';

const router = Router();

router.get('/', authRequired, getAllCases);
router.get('/:id', authRequired, getCaseById);
router.post('/', authRequired, createCase);
router.put('/:id', authRequired, updateCase);
router.delete('/:id', authRequired, deleteCase);
router.get('/:id/access', authRequired, getCaseAccess);
router.post('/:id/access', authRequired, upsertCaseAccess);
router.delete('/:id/access/:internId', authRequired, revokeCaseAccess);

export default router;
