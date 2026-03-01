import { Request, Response } from 'express';
import prisma from '../db';

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

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }
    const template = await prisma.template.create({
      data: { title, content }
    });
    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const template = await prisma.template.update({
      where: { id },
      data: { title, content }
    });
    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.status(500).json({ error: 'Failed to update template' });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.template.delete({ where: { id } });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.status(500).json({ error: 'Failed to delete template' });
  }
};
