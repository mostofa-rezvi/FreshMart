import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../types";
import { ShoppingCartIcon, StarIcon } from "@heroicons/react/24/solid";
import { useCart } from "../hooks/useCart";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, loading: cartLoading } = useCart();

  const handleAddToCart = async () => {
    // Implement add to cart logic, typically 1 item at a time from a card
    await addToCart(product.id, 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
      <Link to={`/products/${product.id}`} className="block">
        <img
          src={
            product.imageUrl ||
            "https://via.placeholder.com/300x200?text=No+Image"
          }
          alt={product.name}
          className="w-full h-48 object-cover object-center"
        />
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 mb-2">
          {product.vendor?.shopName
            ? `by ${product.vendor.shopName}`
            : "Unknown Vendor"}
        </p>
        <div className="flex items-center mb-2">
          {product.averageRating && product.averageRating > 0 ? (
            <>
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.averageRating || 0)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600 text-sm ml-1">
                ({product.averageRating.toFixed(1)} / {product.reviewCount || 0}
                )
              </span>
            </>
          ) : (
            <span className="text-gray-500 text-sm">No reviews yet</span>
          )}
        </div>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-xl font-bold text-green-600">
            ${product.price.toFixed(2)}
          </span>
          {product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={cartLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-1" /> Add
            </button>
          ) : (
            <span className="text-red-500 text-sm font-semibold">
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
