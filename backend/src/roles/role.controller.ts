import { Request, Response } from 'express';
import prisma from '../db';

const ALLOWED_ROLE_NAMES = ['admin', 'lawyer', 'intern'];

export const listRoles = async (_req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(roles);
  } catch (error) {
    console.error('List roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!ALLOWED_ROLE_NAMES.includes(name)) {
      return res.status(400).json({ error: `Role name must be one of: ${ALLOWED_ROLE_NAMES.join(', ')}` });
    }
    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        permissions: permissions || {}
      }
    });
    res.status(201).json(role);
  } catch (error) {
    console.error('Create role error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Role name already exists' });
    }
    res.status(500).json({ error: 'Failed to create role' });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    if (name && !ALLOWED_ROLE_NAMES.includes(name)) {
      return res.status(400).json({ error: `Role name must be one of: ${ALLOWED_ROLE_NAMES.join(', ')}` });
    }
    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions: permissions || {}
      }
    });
    res.json(role);
  } catch (error) {
    console.error('Update role error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Role not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Role name already exists' });
    }
    res.status(500).json({ error: 'Failed to update role' });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({ where: { id } });
    if (role && ALLOWED_ROLE_NAMES.includes(role.name)) {
      return res.status(400).json({ error: 'Default roles cannot be deleted' });
    }
    await prisma.role.delete({ where: { id } });
    res.json({ message: 'Role deleted' });
  } catch (error) {
    console.error('Delete role error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.status(500).json({ error: 'Failed to delete role' });
  }
};
