import axiosInstance from "./axiosInstance";

export const getCart = () => {
  return axiosInstance.get("/cart");
};

export const addToCart = (productId: string, quantity: number) => {
  return axiosInstance.post("/cart", { productId, quantity });
};

export const updateCartItemQuantity = (productId: string, quantity: number) => {
  return axiosInstance.put(`/cart/${productId}`, { quantity });
};

export const removeCartItem = (productId: string) => {
  return axiosInstance.delete(`/cart/${productId}`);
};
