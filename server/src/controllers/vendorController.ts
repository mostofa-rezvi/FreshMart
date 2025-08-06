import { Request, Response } from 'express';
import { PrismaClient, Role, Status } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateVendorStatusSchema = z.object({
  status: z.nativeEnum(Status).refine(s => s === Status.APPROVED || s === Status.REJECTED, {
    message: "Status must be 'APPROVED' or 'REJECTED'."
  }),
});

export const getVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendorProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            createdAt: true,
          },
        },
      },
    });
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Server error fetching vendors.' });
  }
};

export const approveRejectVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // VendorProfile ID
    const { status } = updateVendorStatusSchema.parse(req.body);

    const updatedVendor = await prisma.vendorProfile.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { email: true } }
      }
    });

    res.status(200).json({
      message: `Vendor ${updatedVendor.user?.email}'s status updated to ${updatedVendor.status}`,
      vendor: updatedVendor,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error approving/rejecting vendor:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Vendor-specific: Get own shop profile
export const getMyVendorProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.VENDOR) {
      return res.status(403).json({ message: 'Forbidden: Not a vendor.' });
    }

    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        products: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found.' });
    }

    res.status(200).json(vendorProfile);
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({ message: 'Server error fetching vendor profile.' });
  }
};

// Vendor-specific: Update own shop profile (e.g., description)
const updateShopSchema = z.object({
  shopDescription: z.string().optional(),
  shopName: z.string().optional(),
});
export const updateMyVendorProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.VENDOR) {
      return res.status(403).json({ message: 'Forbidden: Not a vendor.' });
    }
    const { shopDescription, shopName } = updateShopSchema.parse(req.body);

    const updatedProfile = await prisma.vendorProfile.update({
      where: { userId: req.user.id },
      data: { shopDescription, shopName },
    });

    res.status(200).json({ message: 'Vendor profile updated successfully', profile: updatedProfile });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    console.error('Error updating vendor profile:', error);
    res.status(500).json({ message: 'Server error updating vendor profile.' });
  }
};