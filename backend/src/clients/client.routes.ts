import { Router } from 'express';
import { getAllClients, getClientById, createClient, updateClient, deleteClient } from './client.controller';
import { authRequired } from '../auth/auth.middleware';

const router = Router();

router.get('/', authRequired, getAllClients);
router.get('/:id', authRequired, getClientById);
router.post('/', authRequired, createClient);
router.put('/:id', authRequired, updateClient);
router.delete('/:id', authRequired, deleteClient);

export default router;
