import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../auth/auth.middleware';

const isAdmin = (role?: string) => role === 'admin';
const isLawyer = (role?: string) => role === 'lawyer';
const isIntern = (role?: string) => role === 'intern';

// Finds which cases an intern can access.
async function getAccessibleCaseIdsForIntern(internId: string) {
  const access = await prisma.caseAccess.findMany({
    where: { internId },
    select: { caseId: true }
  });
  return access.map((a) => a.caseId);
}

// Gets all cases the current user is allowed to see.
export const getAllCases = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;
    let whereClause: Record<string, any> | undefined;

    if (isLawyer(role)) {
      whereClause = { lawyerId: userId };
    } else if (isIntern(role) && userId) {
      const accessibleIds = await getAccessibleCaseIdsForIntern(userId);
      whereClause = { id: { in: accessibleIds } };
    }

    const cases = await prisma.case.findMany({
      where: whereClause,
      include: {
        client: true,
        lawyer: { select: { id: true, username: true } },
        fees: true,
        payments: { orderBy: { paymentDate: 'desc' } },
        _count: { select: { documents: true, logs: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    const msInDay = 1000 * 60 * 60 * 24;
    const casesWithDeadlineInfo = cases.map((c) => {
      if (c.deadline) {
        const daysUntil = Math.ceil((new Date(c.deadline).getTime() - Date.now()) / msInDay);
        return { ...c, daysUntilDeadline: daysUntil, isOverdue: daysUntil < 0 };
      }
      return c;
    });
    res.json(casesWithDeadlineInfo);
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
};

// Gets detailed info for a single case, including permissions and related data.
export const getCaseById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        client: true,
        lawyer: { select: { id: true, username: true } },
        documents: { orderBy: { createdAt: 'desc' } },
        logs: { orderBy: { timestamp: 'desc' } },
        fees: true,
        payments: { orderBy: { paymentDate: 'desc' } }
      }
    });
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }
    const role = req.user?.role;
    const userId = req.user?.id;
    if (isIntern(role) && userId) {
      const access = await prisma.caseAccess.findUnique({
        where: { caseId_internId: { caseId: id, internId: userId } }
      });
      if (!access) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    } else if (isLawyer(role) && userId && caseData.lawyerId !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (caseData.deadline) {
      const msInDay = 1000 * 60 * 60 * 24;
      const daysUntil = Math.ceil((new Date(caseData.deadline).getTime() - Date.now()) / msInDay);
      const enriched = { ...caseData, daysUntilDeadline: daysUntil, isOverdue: daysUntil < 0 };
      return res.json(enriched);
    }
    res.json(caseData);
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
};

// Creates a new case after validating input and permissions.
export const createCase = async (req: AuthRequest, res: Response) => {
  try {
    const { title, clientIds, clientId, status, deadline, lawyerId: bodyLawyerId, lawyerIds, opposition, oppositionLawyer } = req.body;
    const requester = req.user;
    if (!requester || isIntern(requester.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const primaryLawyerId = isAdmin(requester.role) && bodyLawyerId ? bodyLawyerId : requester.id;
    const lawyerIdsArray: string[] = Array.isArray(lawyerIds)
      ? lawyerIds
      : primaryLawyerId
      ? [primaryLawyerId]
      : [];
    const clientIdsArray: string[] = Array.isArray(clientIds) ? clientIds : clientId ? [clientId] : [];
    const primaryClientId = clientIdsArray[0];
    if (!title || !primaryClientId) {
      return res.status(400).json({ error: 'Title and at least one client required' });
    }
    // validate clients exist
    const existingClients = await prisma.client.findMany({ where: { id: { in: clientIdsArray } }, select: { id: true } });
    if (existingClients.length !== clientIdsArray.length) {
      return res.status(400).json({ error: 'One or more clients not found' });
    }
    const lawyersToAssign = lawyerIdsArray.length ? lawyerIdsArray : [requester.id];
    const existingLawyers = await prisma.user.findMany({ where: { id: { in: lawyersToAssign } }, select: { id: true } });
    if (existingLawyers.length !== lawyersToAssign.length) {
      return res.status(400).json({ error: 'One or more lawyers not found' });
    }
    const caseData = await prisma.case.create({
      data: {
        title,
        clientId: primaryClientId,
        lawyerId: lawyersToAssign[0],
        status: status || 'open',
        deadline: deadline ? new Date(deadline) : null,
        opposition: opposition || null,
        oppositionLawyer: oppositionLawyer || null
      },
      include: {
        client: true,
        lawyer: { select: { id: true, username: true } }
      }
    });
    res.status(201).json(caseData);
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
};

export const updateCase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, status, deadline, lawyerId, clientIds, lawyerIds, opposition, oppositionLawyer } = req.body;
    const requester = req.user;

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Case not found' });

    if (!requester || (isLawyer(requester.role) && existing.lawyerId !== requester.id) || isIntern(requester.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const clientIdsArray: string[] | undefined = Array.isArray(clientIds) ? clientIds : undefined;
    if (clientIdsArray && clientIdsArray.length === 0) {
      return res.status(400).json({ error: 'At least one client required' });
    }
    if (clientIdsArray) {
      const existingClients = await prisma.client.findMany({ where: { id: { in: clientIdsArray } }, select: { id: true } });
      if (existingClients.length !== clientIdsArray.length) {
        return res.status(400).json({ error: 'One or more clients not found' });
      }
    }
    const lawyerIdsArray: string[] | undefined = Array.isArray(lawyerIds) ? lawyerIds : undefined;
    if (lawyerIdsArray) {
      const existingLawyers = await prisma.user.findMany({ where: { id: { in: lawyerIdsArray } }, select: { id: true } });
      if (existingLawyers.length !== lawyerIdsArray.length) {
        return res.status(400).json({ error: 'One or more lawyers not found' });
      }
    }

    const updated = await prisma.case.update({
      where: { id },
      data: {
        title,
        status,
        deadline: deadline ? new Date(deadline) : undefined,
        lawyerId: isAdmin(requester.role) && lawyerId ? lawyerId : undefined,
        opposition: opposition !== undefined ? opposition : undefined,
        oppositionLawyer: oppositionLawyer !== undefined ? oppositionLawyer : undefined,
        ...(clientIdsArray
          ? { clientId: clientIdsArray[0] }
          : {}),
        ...(lawyerIdsArray
          ? { lawyerId: lawyerIdsArray[0] }
          : {})
      },
      include: {
        client: true,
        lawyer: { select: { id: true, username: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update case error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.status(500).json({ error: 'Failed to update case' });
  }
};

export const deleteCase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const requester = req.user;
    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Case not found' });

    if (!requester || (isLawyer(requester.role) && existing.lawyerId !== requester.id) || isIntern(requester.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await prisma.case.delete({ where: { id } });
    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Delete case error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.status(500).json({ error: 'Failed to delete case' });
  }
};

export const getCaseAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const requester = req.user;
    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Case not found' });
    if (
      !requester ||
      (isLawyer(requester.role) && existing.lawyerId !== requester.id) ||
      isIntern(requester.role)
    ) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const accessList = await prisma.caseAccess.findMany({
      where: { caseId: id },
      include: { intern: { select: { id: true, username: true, role: true } } }
    });
    res.json(accessList);
  } catch (error) {
    console.error('Get case access error:', error);
    res.status(500).json({ error: 'Failed to fetch access list' });
  }
};

export const upsertCaseAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // case id
    const { internId, permissions } = req.body as {
      internId: string;
      permissions?: Partial<{
        canViewDocuments: boolean;
        canUploadDocuments: boolean;
        canViewLogs: boolean;
        canAddLogs: boolean;
        canViewPayments: boolean;
      }>;
    };
    const requester = req.user;
    const existingCase = await prisma.case.findUnique({ where: { id } });
    if (!existingCase) return res.status(404).json({ error: 'Case not found' });
    if (
      !requester ||
      (isLawyer(requester.role) && existingCase.lawyerId !== requester.id) ||
      isIntern(requester.role)
    ) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (!internId) {
      return res.status(400).json({ error: 'internId required' });
    }
    const internUser = await prisma.user.findUnique({ where: { id: internId } });
    if (!internUser || internUser.role !== 'intern') {
      return res.status(400).json({ error: 'Intern not found or invalid role' });
    }

    const updated = await prisma.caseAccess.upsert({
      where: { caseId_internId: { caseId: id, internId } },
      update: {
        canViewDocuments: permissions?.canViewDocuments ?? true,
        canUploadDocuments: permissions?.canUploadDocuments ?? false,
        canViewLogs: permissions?.canViewLogs ?? true,
        canAddLogs: permissions?.canAddLogs ?? false,
        canViewPayments: permissions?.canViewPayments ?? false
      },
      create: {
        caseId: id,
        internId,
        grantedById: requester.id,
        canViewDocuments: permissions?.canViewDocuments ?? true,
        canUploadDocuments: permissions?.canUploadDocuments ?? false,
        canViewLogs: permissions?.canViewLogs ?? true,
        canAddLogs: permissions?.canAddLogs ?? false,
        canViewPayments: permissions?.canViewPayments ?? false
      }
    });
    res.status(201).json(updated);
  } catch (error) {
    console.error('Upsert case access error:', error);
    res.status(500).json({ error: 'Failed to save access' });
  }
};

export const revokeCaseAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { id, internId } = req.params;
    const requester = req.user;
    const existingCase = await prisma.case.findUnique({ where: { id } });
    if (!existingCase) return res.status(404).json({ error: 'Case not found' });
    if (
      !requester ||
      (isLawyer(requester.role) && existingCase.lawyerId !== requester.id) ||
      isIntern(requester.role)
    ) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await prisma.caseAccess.delete({
      where: { caseId_internId: { caseId: id, internId } }
    });
    res.json({ message: 'Access revoked' });
  } catch (error) {
    console.error('Revoke case access error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Access not found' });
    }
    res.status(500).json({ error: 'Failed to revoke access' });
  }
};
