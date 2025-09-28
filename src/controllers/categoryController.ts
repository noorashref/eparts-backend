import type { Request, Response } from 'express';
import { z } from 'zod';
import { createCategory, getAllCategories } from '../services/categoryService';

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().max(500).optional(),
});

export const listCategories = async (_req: Request, res: Response) => {
  const categories = await getAllCategories();
  return res.json({ categories });
};

export const addCategory = async (req: Request, res: Response) => {
  const parseResult = categorySchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid category payload', errors: parseResult.error.flatten() });
  }

  const { name, description } = parseResult.data;
  const category = await createCategory(name, description);
  return res.status(201).json({ category });
};
