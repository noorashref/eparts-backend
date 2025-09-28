import { Router } from 'express';
import { createOrderHandler } from '../controllers/orderController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createOrderHandler);

export default router;
