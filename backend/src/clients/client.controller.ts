import { Request, Response } from 'express';
import prisma from '../db';

export const getAllClients = async (_req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        cases: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        cases: {
          include: {
            lawyer: { select: { id: true, username: true } }
          }
        }
      }
    });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, idNumber } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }
    const client = await prisma.client.create({
      data: { name, email, phone, address, idNumber }
    });
    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create client' });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, idNumber } = req.body;
    const client = await prisma.client.update({
      where: { id },
      data: { name, email, phone, address, idNumber }
    });
    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.status(500).json({ error: 'Failed to update client' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.client.delete({ where: { id } });
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.status(500).json({ error: 'Failed to delete client' });
  }
};
