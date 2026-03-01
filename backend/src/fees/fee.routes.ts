import { Router } from 'express';
import { getFeeByCaseId, createOrUpdateFee, addPayment, getMonthlySummary } from './fee.controller';
import { authRequired } from '../auth/auth.middleware';

const router = Router();

router.get('/case/:caseId', authRequired, getFeeByCaseId);
router.post('/', authRequired, createOrUpdateFee);
router.post('/payment', authRequired, addPayment);
router.get('/summary/monthly', authRequired, getMonthlySummary);

export default router;
