import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './auth/auth.routes';
import clientRoutes from './clients/client.routes';
import caseRoutes from './cases/case.routes';
import documentRoutes from './documents/document.routes';
import logRoutes from './logs/log.routes';
import feeRoutes from './fees/fee.routes';
import integrationRoutes from './integrations/integration.routes';
import userRoutes from './users/user.routes';
import templateRoutes from './templates/template.routes';
import roleRoutes from './roles/role.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'LOMS API is running' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 LOMS Backend running at http://${HOST}:${PORT}`);
});
