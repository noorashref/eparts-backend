import { pool } from '../db/pool';

export type ItemRecord = {
  id: number;
  category_id: number;
  name: string;
  brand: string | null;
  model: string | null;
  price: number | null;
  stock: number;
  image_url: string | null;
  description: string | null;
  compatibility_notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ItemInput = {
  categoryId: number;
  name: string;
  brand?: string | undefined;
  model?: string | undefined;
  price?: number | undefined;
  stock?: number | undefined;
  imageUrl?: string | undefined;
  description?: string | undefined;
  compatibilityNotes?: string | undefined;
};

const mapRowToItem = (row: any): ItemRecord => ({
  id: row.id,
  category_id: row.category_id,
  name: row.name,
  brand: row.brand,
  model: row.model,
  price: row.price === null ? null : Number(row.price),
  stock: row.stock,
  image_url: row.image_url,
  description: row.description,
  compatibility_notes: row.compatibility_notes,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const getItems = async (categoryId?: number): Promise<ItemRecord[]> => {
  const result = categoryId
    ? await pool.query(
        `SELECT * FROM items WHERE category_id = $1 ORDER BY name`,
        [categoryId]
      )
    : await pool.query(`SELECT * FROM items ORDER BY name`);

  return result.rows.map(mapRowToItem);
};

export const createItem = async (input: ItemInput): Promise<ItemRecord> => {
  const result = await pool.query(
    `INSERT INTO items (
        category_id,
        name,
        brand,
        model,
        price,
        stock,
        image_url,
        description,
        compatibility_notes
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      input.categoryId,
      input.name,
      input.brand ?? null,
      input.model ?? null,
      input.price ?? null,
      input.stock ?? 0,
      input.imageUrl ?? null,
      input.description ?? null,
      input.compatibilityNotes ?? null,
    ]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error('Failed to create item');
  }

  return mapRowToItem(row);
};

export const updateItem = async (id: number, input: ItemInput): Promise<ItemRecord | null> => {
  const result = await pool.query(
    `UPDATE items
        SET category_id = $1,
            name = $2,
            brand = $3,
            model = $4,
            price = $5,
            stock = $6,
            image_url = $7,
            description = $8,
            compatibility_notes = $9,
            updated_at = NOW()
      WHERE id = $10
  RETURNING *`,
    [
      input.categoryId,
      input.name,
      input.brand ?? null,
      input.model ?? null,
      input.price ?? null,
      input.stock ?? 0,
      input.imageUrl ?? null,
      input.description ?? null,
      input.compatibilityNotes ?? null,
      id,
    ]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return mapRowToItem(row);
};

export const deleteItem = async (id: number): Promise<boolean> => {
  const result = await pool.query('DELETE FROM items WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
};
