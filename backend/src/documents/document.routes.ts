import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import { getDocumentsByCaseId, createDocument, createDocumentFromTemplate, updateDocument, deleteDocument, getAllTemplates } from './document.controller';
import { authRequired } from '../auth/auth.middleware';

const storage = multer.diskStorage({
  // Sets where uploaded files are stored.
  destination: function (_req, _file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  // Sets the filename for uploaded files to make them unique.
  filename: function (_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage });
const router = Router();

router.get('/case/:caseId', authRequired, getDocumentsByCaseId);
router.get('/templates', authRequired, getAllTemplates);
router.post('/', authRequired, upload.single('file'), createDocument);
router.post('/from-template', authRequired, createDocumentFromTemplate);
router.put('/:id', authRequired, upload.single('file'), updateDocument);
router.delete('/:id', authRequired, deleteDocument);

export default router;
