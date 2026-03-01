import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../auth/auth.middleware';

const isAdmin = (role?: string) => role === 'admin';
const isLawyer = (role?: string) => role === 'lawyer';
const isIntern = (role?: string) => role === 'intern';

// Checks if the user can view or add logs for a case.
async function ensureLogAccess(req: AuthRequest, caseId: string, { requireWrite = false }: { requireWrite?: boolean } = {}) {
  const user = req.user;
  if (!user) return { allowed: false, status: 401, message: 'User not authenticated' };

  const caseInfo = await prisma.case.findUnique({ where: { id: caseId }, select: { lawyerId: true } });
  if (!caseInfo) return { allowed: false, status: 404, message: 'Case not found' };

  if (isAdmin(user.role)) return { allowed: true };
  if (isLawyer(user.role)) {
    return caseInfo.lawyerId === user.id
      ? { allowed: true }
      : { allowed: false, status: 403, message: 'Insufficient permissions' };
  }
  if (isIntern(user.role)) {
    const access = await prisma.caseAccess.findUnique({
      where: { caseId_internId: { caseId, internId: user.id } }
    });
    if (!access) return { allowed: false, status: 403, message: 'Insufficient permissions' };
    if (requireWrite && !access.canAddLogs) return { allowed: false, status: 403, message: 'Log write not permitted' };
    if (!access.canViewLogs) return { allowed: false, status: 403, message: 'View not permitted' };
    return { allowed: true };
  }
  return { allowed: false, status: 403, message: 'Insufficient permissions' };
}

// Gets all logs for a case, checking user permissions first.
export const getLogsByCaseId = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId } = req.params;
    const access = await ensureLogAccess(req, caseId);
    if (!access.allowed) return res.status(access.status || 403).json({ error: access.message });
    const logs = await prisma.interactionLog.findMany({
      where: { caseId },
      orderBy: { timestamp: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// Creates a new log entry for a case if allowed.
export const createLog = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId, note } = req.body;
    if (!caseId || !note) {
      return res.status(400).json({ error: 'CaseId and note required' });
    }
    const access = await ensureLogAccess(req, caseId, { requireWrite: true });
    if (!access.allowed) return res.status(access.status || 403).json({ error: access.message });
    const log = await prisma.interactionLog.create({
      data: { caseId, note }
    });
    res.status(201).json(log);
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({ error: 'Failed to create log' });
  }
};
