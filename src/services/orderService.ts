import { pool } from '../db/pool';

export type OrderItemInput = {
  itemId: number;
  quantity: number;
};

type ItemRow = {
  id: number;
  name: string;
  price: number | null;
  stock: number;
};

type OrderRow = {
  id: number;
  user_id: number | null;
  customer_name: string | null;
  customer_email: string;
  notes: string | null;
  total_amount: number;
  status: string;
  created_at: Date;
};

export type CreatedOrder = {
  order: OrderRow;
  items: Array<{
    itemId: number;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
};

class OrderError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'OrderError';
    this.statusCode = statusCode;
  }
}

type CreateOrderInput = {
  userId: number;
  customerName?: string | undefined;
  customerEmail: string;
  notes?: string | undefined;
  items: OrderItemInput[];
};

export const createOrder = async ({
  userId,
  customerName,
  customerEmail,
  notes,
  items,
}: CreateOrderInput): Promise<CreatedOrder> => {
  if (items.length === 0) {
    throw new OrderError('An order must include at least one item.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const itemIds = items.map((item) => item.itemId);
    const { rows } = await client.query<ItemRow>(
      'SELECT id, name, price, stock FROM items WHERE id = ANY($1) FOR UPDATE',
      [itemIds]
    );

    if (rows.length !== items.length) {
      throw new OrderError('One or more items are no longer available.', 404);
    }

    const rowsById = new Map<number, ItemRow>();
    for (const row of rows) {
      rowsById.set(row.id, row);
    }

    const orderItems = items.map((input) => {
      const itemRow = rowsById.get(input.itemId);
      if (!itemRow) {
        throw new OrderError('One or more items are no longer available.', 404);
      }

      if (itemRow.stock < input.quantity) {
        throw new OrderError(
          `Not enough stock for ${itemRow.name}. Available: ${itemRow.stock}.`,
          409
        );
      }

      const unitPrice = itemRow.price === null ? 0 : Number(itemRow.price);
      return {
        itemId: itemRow.id,
        name: itemRow.name,
        quantity: input.quantity,
        unitPrice,
      };
    });

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const orderResult = await client.query<OrderRow>(
      `INSERT INTO orders (user_id, customer_name, customer_email, notes, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, user_id, customer_name, customer_email, notes, total_amount, status, created_at`,
      [userId, customerName ?? null, customerEmail, notes ?? null, totalAmount]
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new OrderError('Failed to create order.', 500);
    }

    for (const orderItem of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, orderItem.itemId, orderItem.quantity, orderItem.unitPrice]
      );

      await client.query(
        'UPDATE items SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
        [orderItem.quantity, orderItem.itemId]
      );
    }

    await client.query('COMMIT');

    return { order, items: orderItems };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof OrderError) {
      throw error;
    }
    throw new OrderError('Unable to create order at this time.', 500);
  } finally {
    client.release();
  }
};

export { OrderError };
