import { Router } from 'express';
import { addCategory, listCategories } from '../controllers/categoryController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, listCategories);
router.post('/', authenticate, requireAdmin, addCategory);

export default router;
