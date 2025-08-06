import axiosInstance from './axiosInstance';
import { Status } from '../types';

export const getVendors = () => {
  return axiosInstance.get('/vendors');
};

export const approveRejectVendor = (vendorId: string, status: Status) => {
  return axiosInstance.put(`/vendors/${vendorId}/status`, { status });
};

export const getMyVendorProfile = () => {
  return axiosInstance.get('/vendors/me');
};

export const updateMyVendorProfile = (shopData: { shopName?: string; shopDescription?: string }) => {
  return axiosInstance.put('/vendors/me', shopData);
};