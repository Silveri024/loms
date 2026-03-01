import { Router } from 'express';
import { authRequired } from '../auth/auth.middleware';

const router = Router();

router.get('/uyap', authRequired, (req, res) => {
  res.json({
    url: 'https://avukatbeta.uyap.gov.tr/giris',
    description: 'UYAP - Turkish National Judiciary Informatics System',
    note: 'Connect to the UYAP portal to manage cases and access court information securely.'
  });
});

export default router;
