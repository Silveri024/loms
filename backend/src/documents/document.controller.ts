
// Core dependencies for handling HTTP requests, file system, and database access
import { Request, Response } from 'express';
import prisma from '../db';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../auth/auth.middleware';


// Helpers to check user roles
const isAdmin = (role?: string) => role === 'admin';
const isLawyer = (role?: string) => role === 'lawyer';
const isIntern = (role?: string) => role === 'intern';


/**
 * Checks if the current user has permission to view or upload documents for a case.
 * Returns an object with allowed status and error info if not permitted.
 * Used by all document-related endpoints to enforce access control.
 */
const ensureDocumentAccess = async (
  req: AuthRequest,
  caseId: string,
  { requireUpload = false }: { requireUpload?: boolean } = {}
) => {
  const requester = req.user;
  if (!requester) return { allowed: false, status: 401, message: 'User not authenticated' };

  const caseInfo = await prisma.case.findUnique({ where: { id: caseId }, select: { lawyerId: true } });
  if (!caseInfo) return { allowed: false, status: 404, message: 'Case not found' };

  if (isAdmin(requester.role)) return { allowed: true };
  if (isLawyer(requester.role)) {
    return caseInfo.lawyerId === requester.id
      ? { allowed: true }
      : { allowed: false, status: 403, message: 'Insufficient permissions' };
  }
  if (isIntern(requester.role)) {
    const access = await prisma.caseAccess.findUnique({
      where: { caseId_internId: { caseId, internId: requester.id } }
    });
    if (!access) return { allowed: false, status: 403, message: 'Insufficient permissions' };
    if (requireUpload && !access.canUploadDocuments) {
      return { allowed: false, status: 403, message: 'Upload not permitted' };
    }
    if (!access.canViewDocuments) {
      return { allowed: false, status: 403, message: 'View not permitted' };
    }
    return { allowed: true };
  }
  return { allowed: false, status: 403, message: 'Insufficient permissions' };
};

/**
 * Returns all documents for a given case, if the user has access.
 * Used to show the list of documents in the case detail view.
 */
export const getDocumentsByCaseId = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId } = req.params;
    const access = await ensureDocumentAccess(req, caseId);
    if (!access.allowed) {
      return res.status(access.status || 403).json({ error: access.message });
    }
    const documents = await prisma.document.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};


// Type for storing document data in the database
type DocumentPayload = {
  caseId: string;
  title: string;
  content: string | null;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
};

/**
 * Creates a new document for a case. Accepts either file upload or text content.
 * Checks permissions and stores file metadata if a file is uploaded.
 */
export const createDocument = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response) => {
  try {
    const { caseId, title, content } = req.body;
    const file = req.file;
    if (!caseId || !title) {
      return res.status(400).json({ error: 'CaseId and title required' });
    }
    const access = await ensureDocumentAccess(req, caseId, { requireUpload: true });
    if (!access.allowed) {
      return res.status(access.status || 403).json({ error: access.message });
    }
    if (!content && !file) {
      return res.status(400).json({ error: 'Either content or file required' });
    }

    const data: DocumentPayload = { caseId, title, content: content || null };
    if (file) {
      data.fileUrl = `/uploads/${file.filename}`;
      data.fileName = file.originalname;
      data.fileType = file.mimetype;
    }

    const document = await prisma.document.create({ data });
    res.status(201).json(document);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

/**
 * Creates a new document for a case using a template.
 * Copies the template content and title, and links it to the case.
 */
export const createDocumentFromTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId, templateId, title } = req.body;
    if (!caseId || !templateId) {
      return res.status(400).json({ error: 'CaseId and templateId required' });
    }
    const access = await ensureDocumentAccess(req, caseId, { requireUpload: true });
    if (!access.allowed) {
      return res.status(access.status || 403).json({ error: access.message });
    }
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    const document = await prisma.document.create({
      data: {
        caseId,
        title: title || template.title,
        content: template.content
      }
    });
    res.status(201).json(document);
  } catch (error) {
    console.error('Create document from template error:', error);
    res.status(500).json({ error: 'Failed to create document from template' });
  }
};

/**
 * Updates an existing document. Can change title/content and replace the file if a new one is uploaded.
 * Removes the old file from disk if replaced.
 */
export const updateDocument = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const file = req.file;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Document not found' });

    const access = await ensureDocumentAccess(req, existing.caseId, { requireUpload: true });
    if (!access.allowed) {
      return res.status(access.status || 403).json({ error: access.message });
    }

    const data: DocumentPayload = { caseId: existing.caseId, title, content: content || null };
    if (file) {
      // remove old file if exists
      if (existing.fileUrl) {
        const oldPath = path.join(__dirname, '..', '..', existing.fileUrl);
        fs.unlink(oldPath, (err) => { if (err) console.warn('Failed to remove old file', err); });
      }
      data.fileUrl = `/uploads/${file.filename}`;
      data.fileName = file.originalname;
      data.fileType = file.mimetype;
    }

    const document = await prisma.document.update({ where: { id }, data });
    res.json(document);
  } catch (error) {
    console.error('Update document error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(500).json({ error: 'Failed to update document' });
  }
};

/**
 * Deletes a document from the database (and file from disk if present).
 * Only allowed if the user has upload permissions for the case.
 */
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Document not found' });

    const access = await ensureDocumentAccess(req, existing.caseId, { requireUpload: true });
    if (!access.allowed) {
      return res.status(access.status || 403).json({ error: access.message });
    }

    await prisma.document.delete({ where: { id } });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

/**
 * Returns all document templates, ordered by creation date.
 * Used for document creation from templates in the UI.
 */
export const getAllTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};
