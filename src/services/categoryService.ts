import { pool } from '../db/pool';

export type CategoryRecord = {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  item_count: number;
};

export const getAllCategories = async (): Promise<CategoryRecord[]> => {
  const result = await pool.query<CategoryRecord>(
    `SELECT c.id,
            c.name,
            c.description,
            c.created_at,
            c.updated_at,
            COUNT(i.id)::int AS item_count
       FROM categories c
  LEFT JOIN items i ON i.category_id = c.id
   GROUP BY c.id
   ORDER BY c.name`
  );

  return result.rows;
};

export const createCategory = async (name: string, description?: string): Promise<CategoryRecord> => {
  const result = await pool.query<CategoryRecord>(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     RETURNING id, name, description, created_at, updated_at, 0::int AS item_count`,
    [name, description ?? null]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error('Failed to create category');
  }

  return row;
};
