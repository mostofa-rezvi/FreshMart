import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import * as productApi from "../api/product";
import { Product, Review, Status } from "../types";
import { StarIcon, ShoppingCartIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../hooks/useAuth"; // Corrected import path
import { useCart } from "../hooks/useCart"; // Corrected import path
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency } from "../utils/helpers"; // Import helper

const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z.string().optional(),
});
type ReviewFormInputs = z.infer<typeof reviewSchema>;

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isCustomer, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reviewAdded, setReviewAdded] = useState(false); // State to trigger review refresh

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReviewFormInputs>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: "" },
  });

  const fetchProduct = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await productApi.getProductById(id);
      if (res.data.status !== "APPROVED") {
        // If product is not approved, show it as not found to customers
        setProduct(null);
        setError("Product not found or not available.");
      } else {
        setProduct(res.data);
      }
      setReviewAdded(false); // Reset review added state on product fetch
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to fetch product details."
      );
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id, reviewAdded]); // Re-fetch when review is added

  const handleAddToCart = async () => {
    if (!product) return;
    // Check if product is in stock and approved before attempting to add to cart
    if (product.stock === 0 || product.status !== "APPROVED") {
      alert("Product is out of stock or not available.");
      return;
    }
    const success = await addToCart(product.id, quantity);
    if (success) {
      alert("Product added to cart!");
    } else {
      // Error is already handled by useCart context and `addToCart` function
      // Optionally show a more specific message here if `useCart` exposed it.
      alert("Failed to add to cart. Please check available stock.");
    }
  };

  const handleReviewSubmit = async (data: ReviewFormInputs) => {
    if (!id) return;
    try {
      await productApi.addReview(id, data.rating, data.comment);
      alert("Review submitted successfully!");
      reset(); // Clear form
      setReviewAdded(true); // Trigger re-fetch of product details
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit review.");
    }
  };

  if (loading)
    return <div className="text-center py-10">Loading product details...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  if (!product)
    return <div className="text-center py-10">Product not found.</div>; // Updated message

  const hasReviewed = product.reviews?.some(
    (review) => review.customerId === user?.id
  );

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Product Image Gallery */}
        <div className="md:w-1/2">
          <img
            src={
              product.imageUrl ||
              "https://via.placeholder.com/600x400?text=No+Image"
            }
            alt={product.name}
            className="w-full h-96 object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Product Details */}
        <div className="md:w-1/2">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {product.name}
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            By{" "}
            <Link
              to={`/vendors/${product.vendor?.user}`}
              className="text-blue-600 hover:underline"
            >
              {product.vendor?.shopName || "Unknown Vendor"}
            </Link>
          </p>

          <div className="flex items-center mb-4">
            {product.averageRating && product.averageRating > 0 ? (
              <>
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-6 w-6 ${
                        i < Math.floor(product.averageRating || 0)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-700 text-lg ml-2 font-semibold">
                  {product.averageRating.toFixed(1)} / 5 ({product.reviewCount}{" "}
                  reviews)
                </span>
              </>
            ) : (
              <span className="text-gray-500 text-md">No reviews yet</span>
            )}
          </div>

          <p className="text-gray-700 text-md mb-6">{product.description}</p>

          <div className="flex items-baseline mb-6">
            <span className="text-4xl font-extrabold text-green-600">
              {formatCurrency(product.price)}
            </span>
            <span className="text-gray-500 ml-4">
              In Stock: {product.stock}
            </span>
          </div>

          {product.stock > 0 ? (
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(
                      1,
                      Math.min(product.stock, parseInt(e.target.value) || 1)
                    )
                  )
                }
                className="w-24 p-2 border border-gray-300 rounded-md text-center"
              />
              <button
                onClick={handleAddToCart}
                disabled={quantity > product.stock}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCartIcon className="h-6 w-6 mr-2" /> Add to Cart
              </button>
            </div>
          ) : (
            <span className="text-red-500 text-xl font-semibold">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Customer Reviews
        </h2>

        {isAuthenticated && isCustomer && !hasReviewed && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
            <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
            <form
              onSubmit={handleSubmit(handleReviewSubmit)}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="rating"
                  className="block text-sm font-medium text-gray-700"
                >
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  id="rating"
                  {...register("rating", { valueAsNumber: true })}
                  min="1"
                  max="5"
                  className="mt-1 block w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
                {errors.rating && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.rating.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700"
                >
                  Comment (Optional)
                </label>
                <textarea
                  id="comment"
                  {...register("comment")}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                ></textarea>
                {errors.comment && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.comment.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
              >
                Submit Review
              </button>
            </form>
          </div>
        )}
        {isAuthenticated && isCustomer && hasReviewed && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg text-blue-800">
            You have already reviewed this product.
          </div>
        )}
        {!isAuthenticated && (
          <div className="mb-8 p-4 bg-yellow-50 rounded-lg text-yellow-800">
            <Link to="/auth" className="underline">
              Log in
            </Link>{" "}
            to add your review!
          </div>
        )}

        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < review.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 font-semibold text-gray-800">
                    {review.customer?.email || "Anonymous"}
                  </span>
                  <span className="text-gray-500 text-sm ml-auto">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 italic">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
