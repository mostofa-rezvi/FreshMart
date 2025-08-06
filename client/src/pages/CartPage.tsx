import React from "react";
import { useCart } from "../hooks/useCart"; // Corrected import path
import { Link, useNavigate } from "react-router-dom";
import { TrashIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/helpers"; // Import helper

const CartPage: React.FC = () => {
  const {
    cart,
    loading,
    error,
    updateCartItemQuantity,
    removeCartItem,
    cartTotal,
  } = useCart();
  const navigate = useNavigate();

  if (loading) return <div className="text-center py-10">Loading cart...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Your Shopping Cart
      </h1>

      {cart.length === 0 ? (
        <div className="text-center bg-gray-100 p-8 rounded-lg shadow-md">
          <p className="text-xl text-gray-600 mb-4">Your cart is empty.</p>
          <Link
            to="/products"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-md p-6">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
                >
                  <div className="flex items-center">
                    <img
                      src={
                        item.product.imageUrl ||
                        "https://via.placeholder.com/80?text=No+Img"
                      }
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-md mr-4"
                    />
                    <div>
                      <Link
                        to={`/products/${item.productId}`}
                        className="text-lg font-semibold text-gray-800 hover:text-blue-600"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-gray-600 text-sm">
                        Vendor: {item.product.vendor?.shopName || "N/A"}
                      </p>
                      <p className="text-gray-600">
                        Price: {formatCurrency(item.product.price)}
                      </p>
                      {item.quantity > item.product.stock && (
                        <p className="text-red-500 text-xs mt-1">
                          Only {item.product.stock} in stock. Quantity adjusted.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="1"
                      max={item.product.stock}
                      value={item.quantity}
                      onChange={(e) =>
                        updateCartItemQuantity(
                          item.productId,
                          parseInt(e.target.value) || 0
                        )
                      } // Allow 0 to trigger removal
                      className="w-20 p-2 border border-gray-300 rounded-md text-center"
                    />
                    <span className="text-lg font-semibold text-gray-800">
                      {formatCurrency(item.quantity * item.product.price)}
                    </span>
                    <button
                      onClick={() => removeCartItem(item.productId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/4 bg-white rounded-lg shadow-md p-6 h-fit sticky top-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Cart Summary
            </h2>
            <div className="flex justify-between items-center text-xl font-semibold mb-6">
              <span>Total:</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              disabled={cart.length === 0}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
