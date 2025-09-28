import type { Request, Response } from 'express';
import { z } from 'zod';
import { createItem, deleteItem, getItems, updateItem } from '../services/itemService';

const baseItemSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(2),
  brand: z.string().optional(),
  model: z.string().optional(),
  price: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
  compatibilityNotes: z.string().optional(),
});

const itemQuerySchema = z.object({
  categoryId: z
    .string()
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => !Number.isNaN(value), {
      message: 'categoryId must be a number',
    })
    .optional(),
});

export const listItems = async (req: Request, res: Response) => {
  const parseResult = itemQuerySchema.safeParse(req.query);

  if (!parseResult.success) {
    return res
      .status(400)
      .json({ message: 'Invalid items query', errors: parseResult.error.flatten() });
  }

  const categoryId = parseResult.data.categoryId;
  const items = await getItems(categoryId);
  return res.json({ items });
};

export const createItemHandler = async (req: Request, res: Response) => {
  const parseResult = baseItemSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res
      .status(400)
      .json({ message: 'Invalid item payload', errors: parseResult.error.flatten() });
  }

  const item = await createItem(parseResult.data);
  return res.status(201).json({ item });
};

export const updateItemHandler = async (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (!idParam) {
    return res.status(400).json({ message: 'Invalid item identifier' });
  }

  const id = Number.parseInt(idParam, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid item identifier' });
  }

  const parseResult = baseItemSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res
      .status(400)
      .json({ message: 'Invalid item payload', errors: parseResult.error.flatten() });
  }

  const updated = await updateItem(id, parseResult.data);

  if (!updated) {
    return res.status(404).json({ message: 'Item not found' });
  }

  return res.json({ item: updated });
};

export const deleteItemHandler = async (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (!idParam) {
    return res.status(400).json({ message: 'Invalid item identifier' });
  }

  const id = Number.parseInt(idParam, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid item identifier' });
  }

  const deleted = await deleteItem(id);

  if (!deleted) {
    return res.status(404).json({ message: 'Item not found' });
  }

  return res.status(204).send();
};
