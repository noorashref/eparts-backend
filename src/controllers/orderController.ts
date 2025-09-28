import type { Request, Response } from 'express';
import { z } from 'zod';
import { createOrder, OrderError } from '../services/orderService';
import { sendOrderConfirmationEmail } from '../services/emailService';

const orderItemSchema = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().int().positive().max(99),
});

const createOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(120).optional(),
  customerEmail: z.string().trim().email().optional(),
  notes: z.string().trim().max(1000).optional(),
  items: z.array(orderItemSchema).min(1),
});

export const createOrderHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const parse = createOrderSchema.safeParse(req.body);

  if (!parse.success) {
    return res
      .status(400)
      .json({ message: 'Invalid order payload', errors: parse.error.flatten() });
  }

  const { customerName, customerEmail: overrideEmail, notes, items } = parse.data;
  const customerEmail = (overrideEmail ?? req.user.email).toLowerCase();

  try {
    const result = await createOrder({
      userId: req.user.userId,
      customerName,
      customerEmail,
      notes,
      items,
    });

    try {
      await sendOrderConfirmationEmail({
        orderId: result.order.id,
        customerName,
        customerEmail,
        items: result.items,
        totalAmount: Number(result.order.total_amount ?? 0),
        notes,
      });
    } catch (emailError) {
      console.error('Failed to send order confirmation email', emailError);
    }

    return res.status(201).json({
      order: {
        id: result.order.id,
        customerName: result.order.customer_name,
        customerEmail: result.order.customer_email,
        notes: result.order.notes,
        totalAmount: Number(result.order.total_amount ?? 0),
        status: result.order.status,
        createdAt: result.order.created_at,
        items: result.items.map((item) => ({
          itemId: item.itemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error('Failed to create order', error);
    return res.status(500).json({ message: 'Unable to create order' });
  }
};
