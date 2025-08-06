import { Router } from 'express';
import { getCart, addToCart, updateCartItemQuantity, removeCartItem } from '../controllers/cartController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/rbacMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken, authorizeRoles(Role.CUSTOMER)); // All cart routes require customer authentication

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:productId', updateCartItemQuantity);
router.delete('/:productId', removeCartItem);

export default router;