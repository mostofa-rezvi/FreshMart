import { Router } from 'express';
import {
  placeOrder,
  getMyOrders,
  getVendorOrders,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
} from '../controllers/orderController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/rbacMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Customer routes
router.post('/', authenticateToken, authorizeRoles(Role.CUSTOMER), placeOrder);
router.get('/my', authenticateToken, authorizeRoles(Role.CUSTOMER), getMyOrders);

// Shared (customer/vendor/admin) - need specific logic inside controller
router.get('/:id', authenticateToken, getOrderDetails);

// Vendor routes
router.get('/vendor', authenticateToken, authorizeRoles(Role.VENDOR), getVendorOrders);
router.put('/:id/status', authenticateToken, authorizeRoles(Role.VENDOR, Role.ADMIN), updateOrderStatus);

// Admin routes
router.get('/', authenticateToken, authorizeRoles(Role.ADMIN), getAllOrders); // Must be placed after /my and /vendor
// (Note: The general '/' route for Admin should be placed carefully to not conflict with others if multiple roles can access parts of the same path. In this setup, it's fine as the roles check handles it.)

export default router;