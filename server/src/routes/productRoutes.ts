import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  approveRejectProduct,
  addReview,
} from '../controllers/productController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/rbacMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Vendor routes
router.post('/', authenticateToken, authorizeRoles(Role.VENDOR), createProduct);
router.put('/:id', authenticateToken, authorizeRoles(Role.VENDOR), updateProduct);
router.delete('/:id', authenticateToken, authorizeRoles(Role.VENDOR), deleteProduct);

// Admin routes
router.put('/:id/status', authenticateToken, authorizeRoles(Role.ADMIN), approveRejectProduct);

// Customer routes (reviews)
router.post('/:id/reviews', authenticateToken, authorizeRoles(Role.CUSTOMER), addReview);

export default router;