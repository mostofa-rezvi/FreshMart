import axiosInstance from "./axiosInstance";
import { Role } from "../types";

export const register = (
  email: string,
  password: string,
  role: Role,
  shopName?: string
) => {
  return axiosInstance.post("/auth/register", {
    email,
    password,
    role,
    shopName,
  });
};

export const login = (email: string, password: string) => {
  return axiosInstance.post("/auth/login", { email, password });
};

export const getProfile = () => {
  return axiosInstance.get("/users/profile");
};
