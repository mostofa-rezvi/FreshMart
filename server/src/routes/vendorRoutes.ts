import { Router } from 'express';
import { getVendors, approveRejectVendor, getMyVendorProfile, updateMyVendorProfile } from '../controllers/vendorController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/rbacMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Admin routes for vendors
router.get('/', authenticateToken, authorizeRoles(Role.ADMIN), getVendors);
router.put('/:id/status', authenticateToken, authorizeRoles(Role.ADMIN), approveRejectVendor);

// Vendor-specific routes
router.get('/me', authenticateToken, authorizeRoles(Role.VENDOR), getMyVendorProfile);
router.put('/me', authenticateToken, authorizeRoles(Role.VENDOR), updateMyVendorProfile);

export default router;