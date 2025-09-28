import { Router } from 'express';
import {
  createItemHandler,
  deleteItemHandler,
  listItems,
  updateItemHandler,
} from '../controllers/itemController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, listItems);
router.post('/', authenticate, requireAdmin, createItemHandler);
router.put('/:id', authenticate, requireAdmin, updateItemHandler);
router.delete('/:id', authenticate, requireAdmin, deleteItemHandler);

export default router;
