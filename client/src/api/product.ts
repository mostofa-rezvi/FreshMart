import axiosInstance from "./axiosInstance";
import { Product, Status } from "../types";

interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  status?: "all" | Status; // For admin/vendor
}

export const getProducts = (params?: GetProductsParams) => {
  return axiosInstance.get("/products", { params });
};

export const getProductById = (id: string) => {
  return axiosInstance.get(`/products/${id}`);
};

export const createProduct = (
  productData: Omit<
    Product,
    | "id"
    | "vendorId"
    | "status"
    | "createdAt"
    | "updatedAt"
    | "category"
    | "vendor"
    | "reviews"
    | "averageRating"
    | "reviewCount"
  >
) => {
  return axiosInstance.post("/products", productData);
};

export const updateProduct = (id: string, productData: Partial<Product>) => {
  return axiosInstance.put(`/products/${id}`, productData);
};

export const deleteProduct = (id: string) => {
  return axiosInstance.delete(`/products/${id}`);
};

export const approveRejectProduct = (id: string, status: Status) => {
  return axiosInstance.put(`/products/${id}/status`, { status });
};

export const addReview = (
  productId: string,
  rating: number,
  comment?: string
) => {
  return axiosInstance.post(`/products/${productId}/reviews`, {
    rating,
    comment,
  });
};
