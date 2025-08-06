import axiosInstance from "./axiosInstance";
import { OrderStatus } from "../types";

export const placeOrder = (shippingAddress: string, contactPhone: string) => {
  return axiosInstance.post("/orders", { shippingAddress, contactPhone });
};

export const getMyOrders = () => {
  return axiosInstance.get("/orders/my");
};

export const getVendorOrders = () => {
  return axiosInstance.get("/orders/vendor");
};

export const getAllOrders = () => {
  return axiosInstance.get("/orders");
};

export const getOrderDetails = (orderId: string) => {
  return axiosInstance.get(`/orders/${orderId}`);
};

export const updateOrderStatus = (orderId: string, status: OrderStatus) => {
  return axiosInstance.put(`/orders/${orderId}/status`, { status });
};
