import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { CartItem, Status } from "../types"; // Import Status
import * as cartApi from "../api/cart";
import { useAuth } from "../hooks/useAuth"; // Updated import path

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<boolean>;
  updateCartItemQuantity: (
    productId: string,
    quantity: number
  ) => Promise<boolean>;
  removeCartItem: (productId: string) => Promise<boolean>;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
}

// Export the context itself
export const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isCustomer, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !isCustomer) {
      setCart([]); // Clear cart if not authenticated or not a customer
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await cartApi.getCart();
      // Filter out products that are not approved or don't exist
      const validatedCart = response.data
        .filter(
          (item: CartItem) =>
            item.product && item.product.status === "APPROVED"
        )
        .map((item: CartItem) => ({
          ...item,
          quantity: Math.min(item.quantity, item.product.stock), // Cap quantity by current stock
        }));
      setCart(validatedCart);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load cart.");
      setCart([]); // Clear cart on error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isCustomer]);

  useEffect(() => {
    if (!authLoading) {
      fetchCart();
    }
  }, [isAuthenticated, isCustomer, authLoading, fetchCart]);

  const addToCart = async (productId: string, quantity: number) => {
    try {
      await cartApi.addToCart(productId, quantity);
      await fetchCart(); // Re-fetch cart to update state
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add to cart.");
      return false;
    }
  };

  const updateCartItemQuantity = async (
    productId: string,
    quantity: number
  ) => {
    try {
      if (quantity === 0) {
        await cartApi.removeCartItem(productId);
      } else {
        await cartApi.updateCartItemQuantity(productId, quantity);
      }
      await fetchCart();
      return true;
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to update cart item quantity."
      );
      return false;
    }
  };

  const removeCartItem = async (productId: string) => {
    try {
      await cartApi.removeCartItem(productId);
      await fetchCart();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove cart item.");
      return false;
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        fetchCart,
        addToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart,
        cartTotal,
        cartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
