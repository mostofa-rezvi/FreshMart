import { Request, Response } from "express";
import { PrismaClient, Role, Status } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { z } from "zod";

const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.nativeEnum(Role).optional().default(Role.CUSTOMER),
  shopName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role, shopName } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    const hashedPassword = await hashPassword(password);

    let newVendorProfile = null;
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    if (role === Role.VENDOR) {
      if (!shopName) {
        return res
          .status(400)
          .json({ message: "Shop name is required for vendor registration." });
      }
      newVendorProfile = await prisma.vendorProfile.create({
        data: {
          userId: newUser.id,
          shopName,
          status: Status.PENDING,
        },
      });
    }

    const token = generateToken({
      userId: newUser.id,
      role: newUser.role,
      vendorProfileId: newVendorProfile?.id, // Include vendorProfileId
    });

    res.status(201).json({
      message: `${role} registered successfully.`,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        vendorStatus: newVendorProfile?.status,
      },
      vendorStatus: newVendorProfile?.status,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.issues });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    let vendorProfile = null;
    if (user.role === Role.VENDOR) {
      vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: user.id },
      });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      vendorProfileId: vendorProfile?.id, // Include vendorProfileId
    });

    res.status(200).json({
      message: "Logged in successfully.",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        vendorStatus: vendorProfile?.status,
      },
      vendorStatus: vendorProfile?.status,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.issues });
    }
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};
