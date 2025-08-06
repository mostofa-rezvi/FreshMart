import { Request, Response } from 'express';
import { PrismaClient, Role, Status, OrderStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Access the Socket.io instance from app.set
const getIo = (req: Request) => req.app.get('io');

const createOrderSchema = z.object({
  shippingAddress: z.string().min(5, 'Shipping address is required.'),
  contactPhone: z.string().min(10, 'Contact phone is required.'),
});

const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const placeOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.CUSTOMER) {
      return res.status(403).json({ message: 'Forbidden: Only customers can place orders.' });
    }

    const { shippingAddress, contactPhone } = createOrderSchema.parse(req.body);

    // Fetch cart items
    const cartItems = await prisma.cart.findMany({
      where: { customerId: req.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            vendorId: true,
            status: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    let totalAmount = 0;
    const orderItemsData: any[] = [];
    const productsToUpdateStock: { id: string; quantity: number }[] = [];
    const vendorsInOrder = new Set<string>(); // To notify relevant vendors

    // Validate stock and build order items
    for (const item of cartItems) {
      if (!item.product || item.product.status !== Status.APPROVED) {
        return res.status(400).json({ message: `Product "${item.product?.name || item.productId}" is not available.` });
      }
      if (item.quantity > item.product.stock) {
        return res.status(400).json({ message: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}` });
      }

      totalAmount += item.quantity * item.product.price.toNumber();
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: item.product.price,
      });
      productsToUpdateStock.push({ id: item.productId, quantity: item.quantity });
      vendorsInOrder.add(item.product.vendorId);
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const newOrder = await tx.order.create({
        data: {
          customerId: req.user!.id,
          totalAmount,
          shippingAddress,
          contactPhone,
          status: OrderStatus.PENDING,
          paymentStatus: 'Pending', // Mock payment
          orderItems: {
            createMany: {
              data: orderItemsData,
            },
          },
        },
      });

      // 2. Decrease product stock
      for (const productUpdate of productsToUpdateStock) {
        await tx.product.update({
          where: { id: productUpdate.id },
          data: {
            stock: {
              decrement: productUpdate.quantity,
            },
          },
        });
      }

      // 3. Clear the user's cart
      await tx.cart.deleteMany({
        where: { customerId: req.user!.id },
      });

      // Mock payment
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: totalAmount,
          paymentMethod: 'Mock Payment',
          status: 'Completed', // For demo, assume success
          transactionId: `mock_txn_${Date.now()}_${newOrder.id.substring(0, 8)}`,
        },
      });

      return newOrder;
    });

    const io = getIo(req);
    // Notify relevant vendors about the new order
    vendorsInOrder.forEach(vendorId => {
      io.to(`vendor_${vendorId}`).emit('newOrderNotification', {
        orderId: result.id,
        message: 'You have a new order!',
        itemsCount: orderItemsData.length,
      });
    });

    res.status(201).json({ message: 'Order placed successfully!', order: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Server error placing order.' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.CUSTOMER) {
      return res.status(403).json({ message: 'Forbidden: Only customers can view their orders.' });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: req.user.id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true,
                vendor: { select: { shopName: true } }
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({ message: 'Server error fetching orders.' });
  }
};

export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const { id: orderId } = req.params;
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, email: true } },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                vendorId: true,
                vendor: { select: { shopName: true } }
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Authorization check: Only customer who placed, vendor whose product is in order, or admin
    const isCustomer = req.user.role === Role.CUSTOMER && order.customerId === req.user.id;
    const isAdmin = req.user.role === Role.ADMIN;
    const isVendor = req.user.role === Role.VENDOR &&
      order.orderItems.some(item => item.product.vendorId === (req.user?.id || '')); // Assuming vendorId is on user for this check

    // To properly check if a vendor can see the order, we need their vendorProfileId attached to req.user.
    // For simplicity, let's assume `req.user.vendorProfileId` is available after `authenticateToken` if the user is a vendor.
    // Modify `authMiddleware.ts` or `login` to include `vendorProfileId` if user is VENDOR.
    // Example: const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
    // token = generateToken({ userId: user.id, role: user.role, vendorProfileId: vendorProfile?.id });
    // And in `authMiddleware.ts`: req.user = { id: decoded.userId, role: decoded.role, vendorProfileId: decoded.vendorProfileId };

    // For now, let's just make it customer/admin/any vendor (less secure, but simpler demo)
    const orderBelongsToVendor = await prisma.orderItem.count({
      where: {
        orderId: order.id,
        product: {
          vendor: {
            userId: req.user.id // Check if any item belongs to the current vendor
          }
        }
      }
    }) > 0;

    if (!(isCustomer || isAdmin || (req.user.role === Role.VENDOR && orderBelongsToVendor))) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to view this order.' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Server error fetching order details.' });
  }
};

// Vendor/Admin: Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id: orderId } = req.params;
    const { status } = updateOrderStatusSchema.parse(req.body);

    if (!req.user || (req.user.role !== Role.ADMIN && req.user.role !== Role.VENDOR)) {
      return res.status(403).json({ message: 'Forbidden: Only admin or vendors can update order status.' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // If Vendor, ensure the order contains products from their shop
    if (req.user.role === Role.VENDOR) {
      const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
      if (!vendorProfile) {
        return res.status(403).json({ message: 'Vendor profile not found.' });
      }

      const orderBelongsToVendor = await prisma.orderItem.count({
        where: {
          orderId: order.id,
          product: { vendorId: vendorProfile.id }
        }
      }) > 0;

      if (!orderBelongsToVendor) {
        return res.status(403).json({ message: 'Forbidden: You can only update orders that contain your products.' });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        customer: { select: { id: true, email: true } },
        orderItems: { include: { product: { select: { id: true, name: true, vendorId: true } } } },
      },
    });

    const io = getIo(req);
    // Notify customer about status change
    io.to(`customer_${updatedOrder.customerId}`).emit('orderStatusUpdate', {
      orderId: updatedOrder.id,
      newStatus: updatedOrder.status,
      message: `Your order ${updatedOrder.id} is now ${updatedOrder.status}.`,
    });

    res.status(200).json({ message: 'Order status updated successfully.', order: updatedOrder });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error updating order status.' });
  }
};

export const getVendorOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.VENDOR) {
      return res.status(403).json({ message: 'Forbidden: Not a vendor.' });
    }

    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found.' });
    }

    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            product: {
              vendorId: vendorProfile.id,
            },
          },
        },
      },
      include: {
        customer: { select: { email: true } },
        orderItems: {
          include: {
            product: { select: { name: true, price: true, imageUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    res.status(500).json({ message: 'Server error fetching vendor orders.' });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: { select: { email: true } },
        orderItems: {
          include: {
            product: { select: { name: true, price: true, imageUrl: true, vendor: { select: { shopName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching all orders (admin):', error);
    res.status(500).json({ message: 'Server error fetching all orders.' });
  }
};