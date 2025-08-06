import React, { useState, useEffect } from "react";
import { useCart } from "../hooks/useCart"; // Corrected import path
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as orderApi from "../api/order";
import { formatCurrency } from "../utils/helpers"; // Import helper

const checkoutSchema = z.object({
  shippingAddress: z
    .string()
    .min(10, "Shipping address must be at least 10 characters."),
  contactPhone: z.string().min(10, "Contact phone must be at least 10 digits."),
  // Mock payment details (for demo purposes) are optional as they are pre-filled and read-only
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
});

type CheckoutFormInputs = z.infer<typeof checkoutSchema>;

const CheckoutPage: React.FC = () => {
  const {
    cart,
    loading: cartLoading,
    error: cartError,
    cartTotal,
    clearCart,
  } = useCart();
  const navigate = useNavigate();
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormInputs>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      cardNumber: "4111222233334444", // Mock value
      expiryDate: "12/25", // Mock value
      cvv: "123", // Mock value
    },
  });

  useEffect(() => {
    if (!cartLoading && cart.length === 0 && !cartError) {
      // Only redirect if cart is definitively empty and no loading/error
      navigate("/cart");
    }
  }, [cartLoading, cart, cartError, navigate]);

  const onSubmit = async (data: CheckoutFormInputs) => {
    setIsProcessingOrder(true);
    setOrderError(null);
    try {
      await orderApi.placeOrder(data.shippingAddress, data.contactPhone);
      clearCart(); // Clear cart in frontend after successful order
      alert("Order placed successfully! Redirecting to your orders.");
      navigate("/my-orders");
    } catch (err: any) {
      setOrderError(err.response?.data?.message || "Failed to place order.");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  if (cartLoading)
    return (
      <div className="text-center py-10">Loading cart for checkout...</div>
    );
  if (cartError)
    return (
      <div className="text-center py-10 text-red-500">
        Error loading cart: {cartError}
      </div>
    );
  if (cart.length === 0) return null; // Will be redirected by useEffect if cart is truly empty

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Checkout
      </h1>

      {orderError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {orderError}</span>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Order Summary
        </h2>
        <div className="space-y-4">
          {cart.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between items-center border-b pb-2"
            >
              <span className="text-gray-700">
                {item.product.name} (x{item.quantity})
              </span>
              <span className="font-semibold">
                {formatCurrency(item.quantity * item.product.price)}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center text-xl font-bold pt-4">
            <span>Total:</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Shipping Information
        </h2>
        <div>
          <label
            htmlFor="shippingAddress"
            className="block text-sm font-medium text-gray-700"
          >
            Shipping Address
          </label>
          <textarea
            id="shippingAddress"
            {...register("shippingAddress")}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Street, City, State, Zip Code"
          ></textarea>
          {errors.shippingAddress && (
            <p className="text-red-500 text-xs mt-1">
              {errors.shippingAddress.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="contactPhone"
            className="block text-sm font-medium text-gray-700"
          >
            Contact Phone
          </label>
          <input
            type="text"
            id="contactPhone"
            {...register("contactPhone")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 123-456-7890"
          />
          {errors.contactPhone && (
            <p className="text-red-500 text-xs mt-1">
              {errors.contactPhone.message}
            </p>
          )}
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4 pt-6 border-t">
          Payment Information (Mock)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="cardNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Card Number
            </label>
            <input
              type="text"
              id="cardNumber"
              {...register("cardNumber")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              readOnly
            />
          </div>
          <div>
            <label
              htmlFor="expiryDate"
              className="block text-sm font-medium text-gray-700"
            >
              Expiry Date (MM/YY)
            </label>
            <input
              type="text"
              id="expiryDate"
              {...register("expiryDate")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              readOnly
            />
          </div>
          <div>
            <label
              htmlFor="cvv"
              className="block text-sm font-medium text-gray-700"
            >
              CVV
            </label>
            <input
              type="text"
              id="cvv"
              {...register("cvv")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              readOnly
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessingOrder}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessingOrder
            ? "Placing Order..."
            : `Pay ${formatCurrency(cartTotal)} & Place Order`}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;
