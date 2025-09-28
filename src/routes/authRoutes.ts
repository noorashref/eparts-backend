import { Router } from 'express';
import { googleSignIn, login, register } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/google', googleSignIn);

export default router;
