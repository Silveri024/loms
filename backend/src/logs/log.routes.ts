import { Router } from 'express';
import { getLogsByCaseId, createLog } from './log.controller';
import { authRequired } from '../auth/auth.middleware';

const router = Router();

router.get('/case/:caseId', authRequired, getLogsByCaseId);
router.post('/', authRequired, createLog);

export default router;
