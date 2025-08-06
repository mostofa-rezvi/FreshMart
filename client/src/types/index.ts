export type Role = "ADMIN" | "VENDOR" | "CUSTOMER";
export type Status = "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface User {
  id: string;
  email: string;
  role: Role;
  vendorStatus?: Status; // Only for VENDOR role
  shopName?: string; // Only for VENDOR role
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  isCustomer: boolean;
  isVendorApproved: boolean;
  loading: boolean;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  // Included from relations
  category?: { name: string };
  vendor?: {
    shopName: string;
    shopDescription?: string;
    status: Status;
    user: { email: string };
  };
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  customer?: { id: string; email: string };
}

export interface CartItem {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: Product; // Full product details
}

export interface Order {
  id: string;
  customerId: string;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: string;
  shippingAddress: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; email: string };
  orderItems: OrderItem[];
  payments: Payment[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtOrder: number;
  product: Product; // Details of the product at the time of order
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId?: string;
  createdAt: string;
}

export interface VendorProfile {
  id: string;
  userId: string;
  shopName: string;
  shopDescription?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  user: { email: string };
  products: Product[];
}
