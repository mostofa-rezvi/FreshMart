import { Request, Response } from 'express';
import { PrismaClient, Role, Status } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const cartItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID.'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
});

export const getCart = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.CUSTOMER) {
      return res.status(403).json({ message: 'Forbidden: Only customers have a cart.' });
    }

    const cartItems = await prisma.cart.findMany({
      where: { customerId: req.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            imageUrl: true,
            status: true, // Check product status
            vendor: { select: { shopName: true } }
          },
        },
      },
    });

    const validatedCart = cartItems
      .filter(item => item.product && item.product.status === Status.APPROVED) // Only include approved products
      .map(item => ({
        ...item,
        quantity: Math.min(item.quantity, item.product.stock), // Cap quantity by current stock
      }));

    res.status(200).json(validatedCart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error fetching cart.' });
  }
};

export const addToCart = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.CUSTOMER) {
      return res.status(403).json({ message: 'Forbidden: Only customers can add to cart.' });
    }

    const { productId, quantity } = cartItemSchema.parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, status: true, name: true },
    });

    if (!product || product.status !== Status.APPROVED) {
      return res.status(404).json({ message: 'Product not found or not available.' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Not enough stock for ${product.name}. Available: ${product.stock}` });
    }

    const cartItem = await prisma.cart.upsert({
      where: {
        customerId_productId: {
          customerId: req.user.id,
          productId,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        customerId: req.user.id,
        productId,
        quantity,
      },
    });

    res.status(200).json({ message: 'Product added/updated in cart successfully.', cartItem });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error adding to cart.' });
  }
};

export const updateCartItemQuantity = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.CUSTOMER) {
      return res.status(403).json({ message: 'Forbidden: Only customers can update cart.' });
    }

    const { productId } = req.params;
    const { quantity } = z.object({ quantity: z.number().int().min(0, 'Quantity cannot be negative.') }).parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, name: true, status: true },
    });

    if (!product || product.status !== Status.APPROVED) {
      return res.status(404).json({ message: 'Product not found or not available.' });
    }
    if (quantity > product.stock) {
      return res.status(400).json({ message: `Cannot set quantity more than available stock (${product.stock}).` });
    }

    if (quantity === 0) {
      await prisma.cart.delete({
        where: {
          customerId_productId: {
            customerId: req.user.id,
            productId,
          },
        },
      });
      return res.status(200).json({ message: 'Product removed from cart.' });
    }

    const updatedCartItem = await prisma.cart.update({
      where: {
        customerId_productId: {
          customerId: req.user.id,
          productId,
        },
      },
      data: { quantity },
    });

    res.status(200).json({ message: 'Cart item quantity updated successfully.', cartItem: updatedCartItem });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error updating cart item quantity:', error);
    res.status(500).json({ message: 'Server error updating cart item quantity.' });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.CUSTOMER) {
      return res.status(403).json({ message: 'Forbidden: Only customers can remove from cart.' });
    }

    const { productId } = req.params;

    await prisma.cart.delete({
      where: {
        customerId_productId: {
          customerId: req.user.id,
          productId,
        },
      },
    });

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ message: 'Server error removing cart item.' });
  }
};