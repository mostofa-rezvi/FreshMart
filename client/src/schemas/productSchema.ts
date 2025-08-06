import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(3, "Product name is required."),
  description: z.string().optional(),
  price: z.preprocess(
    (val) => Number(val),
    z.number().positive("Price must be a positive number.")
  ),
  stock: z.preprocess(
    (val) => Number(val),
    z.number().int().min(0, "Stock cannot be negative.")
  ),
  categoryId: z.string().uuid("Please select a category."),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")), // Correct Zod syntax
});

export type ProductFormInputs = z.infer<typeof productFormSchema>;
