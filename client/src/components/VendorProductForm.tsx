import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Product, Category } from "../types";

// Zod schema for Product creation/update
const productFormSchema = z.object({
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
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")), // Allow empty string for optional
});
export type ProductFormInputs = z.infer<typeof productFormSchema>;

interface VendorProductFormProps {
  categories: Category[];
  editingProduct: Product | null;
  onSubmit: (data: ProductFormInputs) => void;
  onCancelEdit: () => void;
  formMethods: UseFormReturn<ProductFormInputs>; // Pass form methods from parent
}

const VendorProductForm: React.FC<VendorProductFormProps> = ({
  categories,
  editingProduct,
  onSubmit,
  onCancelEdit,
  formMethods,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = formMethods;

  return (
    <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editingProduct ? "Edit Product" : "Add New Product"}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Product Name
          </label>
          <input
            type="text"
            id="name"
            {...register("name")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Price
            </label>
            <input
              type="number"
              step="0.01"
              id="price"
              {...register("price")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {errors.price && (
              <p className="text-red-500 text-xs mt-1">
                {errors.price.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="stock"
              className="block text-sm font-medium text-gray-700"
            >
              Stock
            </label>
            <input
              type="number"
              id="stock"
              {...register("stock")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {errors.stock && (
              <p className="text-red-500 text-xs mt-1">
                {errors.stock.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <label
            htmlFor="categoryId"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="categoryId"
            {...register("categoryId")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-red-500 text-xs mt-1">
              {errors.categoryId.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="imageUrl"
            className="block text-sm font-medium text-gray-700"
          >
            Image URL (Optional)
          </label>
          <input
            type="text"
            id="imageUrl"
            {...register("imageUrl")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {errors.imageUrl && (
            <p className="text-red-500 text-xs mt-1">
              {errors.imageUrl.message}
            </p>
          )}
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />{" "}
            {editingProduct ? "Update Product" : "Add Product"}
          </button>
          {editingProduct && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="bg-gray-400 text-white px-6 py-2 rounded-md hover:bg-gray-500"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VendorProductForm;
