import { Request, Response } from 'express';
import { PrismaClient, Role, Status } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const productSchema = z.object({
  name: z.string().min(3, 'Product name is required.'),
  description: z.string().optional(),
  price: z.number().positive('Price must be a positive number.'),
  stock: z.number().int().min(0, 'Stock cannot be negative.'),
  categoryId: z.string().uuid('Invalid category ID.'),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

const updateProductStatusSchema = z.object({
  status: z.nativeEnum(Status).refine(s => s === Status.APPROVED || s === Status.REJECTED || s === Status.INACTIVE, {
    message: "Status must be 'APPROVED', 'REJECTED', or 'INACTIVE'."
  }),
});

// --- Vendor Actions ---
export const createProduct = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.VENDOR) {
      return res.status(403).json({ message: 'Forbidden: Only vendors can add products.' });
    }

    const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
    if (!vendorProfile || vendorProfile.status !== Status.APPROVED) {
      return res.status(403).json({ message: 'Your vendor account is not approved yet or does not exist.' });
    }

    const { name, description, price, stock, categoryId, imageUrl } = productSchema.parse(req.body);

    const product = await prisma.product.create({
      data: {
        vendorId: vendorProfile.id,
        name,
        description,
        price,
        stock,
        categoryId,
        imageUrl,
        status: Status.PENDING, // Products also need admin approval
      },
    });

    res.status(201).json({ message: 'Product created successfully, awaiting admin approval.', product });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error creating product.' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.VENDOR) {
      return res.status(403).json({ message: 'Forbidden: Only vendors can update products.' });
    }

    const { id } = req.params; // Product ID
    const updates = productSchema.partial().parse(req.body);

    // Verify product belongs to the vendor
    const product = await prisma.product.findUnique({ where: { id } });
    const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });

    if (!product || !vendorProfile || product.vendorId !== vendorProfile.id) {
      return res.status(404).json({ message: 'Product not found or does not belong to your shop.' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...updates,
        status: Status.PENDING, // Any significant update might require re-approval
      },
    });

    res.status(200).json({ message: 'Product updated successfully, awaiting re-approval.', product: updatedProduct });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error updating product.' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.VENDOR) {
      return res.status(403).json({ message: 'Forbidden: Only vendors can delete products.' });
    }

    const { id } = req.params; // Product ID

    const product = await prisma.product.findUnique({ where: { id } });
    const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });

    if (!product || !vendorProfile || product.vendorId !== vendorProfile.id) {
      return res.status(404).json({ message: 'Product not found or does not belong to your shop.' });
    }

    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error deleting product.' });
  }
};

// --- Admin Actions ---
export const approveRejectProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Product ID
    const { status } = updateProductStatusSchema.parse(req.body);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({ message: 'Product status updated successfully.', product: updatedProduct });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error approving/rejecting product:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Public/Customer Actions ---
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, categoryId, minPrice, maxPrice, sortBy, order, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      status: Status.APPROVED, // Only approved products visible to customers
    };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = (order as string) || 'asc';
    } else {
      orderBy.createdAt = 'desc'; // Default sort
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        take,
        skip,
        orderBy,
        include: {
          category: { select: { name: true } },
          vendor: { select: { shopName: true } },
          reviews: { select: { rating: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average rating
    const productsWithAvgRating = products.map(product => {
      const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = product.reviews.length > 0 ? totalRating / product.reviews.length : 0;
      return {
        ...product,
        averageRating: parseFloat(averageRating.toFixed(1)), // Round to 1 decimal
        reviewCount: product.reviews.length,
        reviews: undefined, // Remove raw reviews from product list
      };
    });


    res.status(200).json({
      data: productsWithAvgRating,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error fetching products.' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
            shopDescription: true,
            status: true,
            user: { select: { email: true } },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        reviews: {
          include: {
            customer: { select: { email: true, id: true } },
          },
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!product || product.status !== Status.APPROVED) { // Only show approved products
      return res.status(404).json({ message: 'Product not found or not available.' });
    }

    // Calculate average rating for single product view
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = product.reviews.length > 0 ? totalRating / product.reviews.length : 0;

    res.status(200).json({
      ...product,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount: product.reviews.length,
    });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Server error fetching product.' });
  }
};

// Review actions
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5.'),
  comment: z.string().optional(),
});

export const addReview = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.CUSTOMER) {
      return res.status(403).json({ message: 'Forbidden: Only customers can add reviews.' });
    }
    const { id: productId } = req.params;
    const { rating, comment } = reviewSchema.parse(req.body);

    // Check if product exists and is approved
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== Status.APPROVED) {
      return res.status(404).json({ message: 'Product not found or not approved.' });
    }

    // Check if customer already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_customerId: {
          productId: productId,
          customerId: req.user.id,
        },
      },
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product.' });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        customerId: req.user.id,
        rating,
        comment,
      },
    });

    res.status(201).json({ message: 'Review added successfully.', review });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error adding review.' });
  }
};