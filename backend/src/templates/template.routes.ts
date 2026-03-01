import { Router } from 'express';
import { getAllTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate } from './template.controller';
import { authRequired } from '../auth/auth.middleware';

const router = Router();

router.get('/', authRequired, getAllTemplates);
router.get('/:id', authRequired, getTemplateById);
router.post('/', authRequired, createTemplate);
router.put('/:id', authRequired, updateTemplate);
router.delete('/:id', authRequired, deleteTemplate);

export default router;
