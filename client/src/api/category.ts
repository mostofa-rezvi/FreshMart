import axiosInstance from "./axiosInstance";

export const getCategories = () => {
  return axiosInstance.get("/categories");
};

export const createCategory = (name: string, description?: string) => {
  return axiosInstance.post("/categories", { name, description });
};

export const updateCategory = (
  id: string,
  name: string,
  description?: string
) => {
  return axiosInstance.put(`/categories/${id}`, { name, description });
};

export const deleteCategory = (id: string) => {
  return axiosInstance.delete(`/categories/${id}`);
};
