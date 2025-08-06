import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const categorySchema = z.object({
  name: z.string().min(3, 'Category name is required and must be at least 3 characters.'),
  description: z.string().optional(),
});

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data: { name, description } });
    res.status(201).json(category);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error creating category.' });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error fetching categories.' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = categorySchema.partial().parse(req.body); // Allow partial updates
    const category = await prisma.category.update({
      where: { id },
      data: { name, description },
    });
    res.status(200).json(category);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error updating category.' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error deleting category.' });
  }
};