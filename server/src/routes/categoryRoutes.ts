import { Router } from 'express';
import { createCategory, getCategories, updateCategory, deleteCategory } from '../controllers/categoryController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/rbacMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.post('/', authenticateToken, authorizeRoles(Role.ADMIN), createCategory);
router.get('/', getCategories); // Publicly accessible to browse
router.put('/:id', authenticateToken, authorizeRoles(Role.ADMIN), updateCategory);
router.delete('/:id', authenticateToken, authorizeRoles(Role.ADMIN), deleteCategory);

export default router;