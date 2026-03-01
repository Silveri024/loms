import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../auth/auth.middleware';

const isAdmin = (role?: string) => role === 'admin';
const isLawyer = (role?: string) => role === 'lawyer';
const isIntern = (role?: string) => role === 'intern';

// Checks if the user has permission to view or edit fees for a case.
async function ensureFeeAccess(req: AuthRequest, caseId: string, { requireWrite = false }: { requireWrite?: boolean } = {}) {
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
    if (!access.canViewPayments) return { allowed: false, status: 403, message: 'Payments view not permitted' };
    if (requireWrite) return { allowed: false, status: 403, message: 'Write not permitted' };
    return { allowed: true };
  }
  return { allowed: false, status: 403, message: 'Insufficient permissions' };
}

// Returns the fee details for a specific case if the user has access.
export const getFeeByCaseId = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId } = req.params;
    const access = await ensureFeeAccess(req, caseId);
    if (!access.allowed) return res.status(access.status || 403).json({ error: access.message });
    const fee = await prisma.caseFee.findUnique({ where: { caseId } });
    res.json(fee);
  } catch (error) {
    console.error('Get fee error:', error);
    res.status(500).json({ error: 'Failed to fetch fee' });
  }
};

// Creates or updates the fee for a case, only if the user can edit.
export const createOrUpdateFee = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId, totalFee } = req.body;
    if (!caseId || totalFee === undefined) {
      return res.status(400).json({ error: 'CaseId and totalFee required' });
    }
    const access = await ensureFeeAccess(req, caseId, { requireWrite: true });
    if (!access.allowed) return res.status(access.status || 403).json({ error: access.message });
    const fee = await prisma.caseFee.upsert({
      where: { caseId },
      update: { totalFee },
      create: { caseId, totalFee, amountPaid: 0, paymentStatus: 'pending' }
    });
    res.json(fee);
  } catch (error) {
    console.error('Create/update fee error:', error);
    res.status(500).json({ error: 'Failed to create/update fee' });
  }
};

// Adds a payment to a case and updates the fee status.
export const addPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId, amount, method } = req.body;
    if (!caseId || !amount || !method) {
      return res.status(400).json({ error: 'CaseId, amount, and method required' });
    }
    const access = await ensureFeeAccess(req, caseId, { requireWrite: true });
    if (!access.allowed) return res.status(access.status || 403).json({ error: access.message });
    const payment = await prisma.payment.create({
      data: { caseId, amount: parseFloat(amount), method }
    });
    const fee = await prisma.caseFee.findUnique({ where: { caseId } });
    if (!fee) {
      return res.status(404).json({ error: 'Fee not found for this case' });
    }
    const newAmountPaid = fee.amountPaid + parseFloat(amount);
    let paymentStatus = 'pending';
    if (newAmountPaid >= fee.totalFee) {
      paymentStatus = 'paid';
    } else if (newAmountPaid > 0) {
      paymentStatus = 'partial';
    }
    const updatedFee = await prisma.caseFee.update({
      where: { caseId },
      data: { amountPaid: newAmountPaid, paymentStatus }
    });
    res.status(201).json({ payment, updatedFee });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ error: 'Failed to add payment' });
  }
};

export const getMonthlySummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const { year, month } = req.query;
    const yearStr = Array.isArray(year) ? year[0] : year;
    const monthStr = Array.isArray(month) ? month[0] : month;

    if (!yearStr || !monthStr || typeof yearStr !== 'string' || typeof monthStr !== 'string') {
      return res.status(400).json({ error: 'Year and month required' });
    }
    const parsedYear = parseInt(yearStr, 10);
    const parsedMonth = parseInt(monthStr, 10);

    const startDate = new Date(parsedYear, parsedMonth - 1, 1);
    const endDate = new Date(parsedYear, parsedMonth, 0, 23, 59, 59);
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: startDate, lte: endDate }
      }
    });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    res.json({
      year: parsedYear,
      month: parsedMonth,
      totalPayments: payments.length,
      totalRevenue,
      payments
    });
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({ error: 'Failed to get monthly summary' });
  }
};
