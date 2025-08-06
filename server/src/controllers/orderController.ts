import { Request, Response } from "express";
import { PrismaClient, Role, Status, OrderStatus } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const getIo = (req: Request) => req.app.get("io");

const createOrderSchema = z.object({
  shippingAddress: z.string().min(5, "Shipping address is required."),
  contactPhone: z.string().min(10, "Contact phone is required."),
});

const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const placeOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.CUSTOMER) {
      return res
        .status(403)
        .json({ message: "Forbidden: Only customers can place orders." });
    }

    const { shippingAddress, contactPhone } = createOrderSchema.parse(req.body);

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
      return res.status(400).json({ message: "Your cart is empty." });
    }

    let totalAmount = 0;
    const orderItemsData: any[] = [];
    const productsToUpdateStock: { id: string; quantity: number }[] = [];
    const vendorsInOrder = new Set<string>();

    for (const item of cartItems) {
      if (!item.product || item.product.status !== Status.APPROVED) {
        return res
          .status(400)
          .json({
            message: `Product "${
              item.product?.name || item.productId
            }" is not available or approved.`,
          });
      }
      if (item.quantity > item.product.stock) {
        return res
          .status(400)
          .json({
            message: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}`,
          });
      }

      totalAmount += item.quantity * item.product.price.toNumber();
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: item.product.price,
      });
      productsToUpdateStock.push({
        id: item.productId,
        quantity: item.quantity,
      });
      vendorsInOrder.add(item.product.vendorId);
    }

    const result = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: req.user!.id,
          totalAmount,
          shippingAddress,
          contactPhone,
          status: OrderStatus.PENDING,
          paymentStatus: "Pending",
          orderItems: {
            createMany: {
              data: orderItemsData,
            },
          },
        },
      });

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

      await tx.cart.deleteMany({
        where: { customerId: req.user!.id },
      });

      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: totalAmount,
          paymentMethod: "Mock Payment",
          status: "Completed",
          transactionId: `mock_txn_${Date.now()}_${newOrder.id.substring(
            0,
            8
          )}`,
        },
      });

      return newOrder;
    });

    const io = getIo(req);
    vendorsInOrder.forEach(async (vendorProfileId) => {
      const vendorUser = await prisma.vendorProfile.findUnique({
        where: { id: vendorProfileId },
        select: { userId: true },
      });
      if (vendorUser?.userId) {
        io.to(`vendor_user_${vendorUser.userId}`).emit("newOrderNotification", {
          // Notify based on vendor's user ID
          orderId: result.id,
          message: "You have a new order!",
          itemsCount: orderItemsData.length,
        });
      }
    });

    res
      .status(201)
      .json({ message: "Order placed successfully!", order: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.issues });
    }
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Server error placing order." });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.CUSTOMER) {
      return res
        .status(403)
        .json({ message: "Forbidden: Only customers can view their orders." });
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
                vendor: { select: { shopName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching my orders:", error);
    res.status(500).json({ message: "Server error fetching orders." });
  }
};

export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const { id: orderId } = req.params;
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized." });
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
                vendor: { select: { shopName: true } },
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const isCustomer =
      req.user.role === Role.CUSTOMER && order.customerId === req.user.id;
    const isAdmin = req.user.role === Role.ADMIN;
    const isOrderForVendor =
      req.user.role === Role.VENDOR &&
      req.user.vendorProfileId &&
      order.orderItems.some(
        (item) => item.product.vendorId === req.user?.vendorProfileId
      );

    if (!(isCustomer || isAdmin || isOrderForVendor)) {
      return res
        .status(403)
        .json({
          message: "Forbidden: You do not have permission to view this order.",
        });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Server error fetching order details." });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id: orderId } = req.params;
    const { status } = updateOrderStatusSchema.parse(req.body);

    if (
      !req.user ||
      (req.user.role !== Role.ADMIN && req.user.role !== Role.VENDOR)
    ) {
      return res
        .status(403)
        .json({
          message: "Forbidden: Only admin or vendors can update order status.",
        });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (req.user.role === Role.VENDOR) {
      if (!req.user.vendorProfileId) {
        return res
          .status(403)
          .json({
            message: "Vendor profile ID not found for authenticated vendor.",
          });
      }

      const orderBelongsToVendor =
        (await prisma.orderItem.count({
          where: {
            orderId: order.id,
            product: { vendorId: req.user.vendorProfileId },
          },
        })) > 0;

      if (!orderBelongsToVendor) {
        return res
          .status(403)
          .json({
            message:
              "Forbidden: You can only update orders that contain your products.",
          });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        customer: { select: { id: true, email: true } },
        orderItems: {
          include: {
            product: { select: { id: true, name: true, vendorId: true } },
          },
        },
      },
    });

    const io = getIo(req);
    // Notify customer about status change
    io.to(`customer_user_${updatedOrder.customerId}`).emit(
      "orderStatusUpdate",
      {
        // Room based on customer user ID
        orderId: updatedOrder.id,
        newStatus: updatedOrder.status,
        message: `Your order ${updatedOrder.id} is now ${updatedOrder.status}.`,
      }
    );

    res
      .status(200)
      .json({
        message: "Order status updated successfully.",
        order: updatedOrder,
      });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.issues });
    }
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error updating order status." });
  }
};

export const getVendorOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.VENDOR) {
      return res.status(403).json({ message: "Forbidden: Not a vendor." });
    }
    if (!req.user.vendorProfileId) {
      return res
        .status(404)
        .json({
          message: "Vendor profile ID not found for authenticated vendor.",
        });
    }

    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            product: {
              vendorId: req.user.vendorProfileId,
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
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    res.status(500).json({ message: "Server error fetching vendor orders." });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: { select: { email: true } },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                imageUrl: true,
                vendor: { select: { shopName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching all orders (admin):", error);
    res.status(500).json({ message: "Server error fetching all orders." });
  }
};
