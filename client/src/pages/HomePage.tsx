import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as productApi from "../api/product";
import * as categoryApi from "../api/category";
import { Product, Category, Status } from "../types"; // Import Status for filtering
import ProductCard from "../components/ProductCard";

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          productApi.getProducts({
            limit: 8,
            sortBy: "createdAt",
            order: "desc",
            status: "APPROVED",
          }), // Only show approved products
          categoryApi.getCategories(),
        ]);
        setFeaturedProducts(productsRes.data.data);
        setCategories(categoriesRes.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load homepage data."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-20 px-8 text-center rounded-lg shadow-lg mb-12">
        <h1 className="text-5xl font-extrabold mb-4">Welcome to FreshMart</h1>
        <p className="text-xl mb-8">
          Your one-stop multi-vendor marketplace for fresh produce and more!
        </p>
        <Link
          to="/products"
          className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition duration-300"
        >
          Start Shopping
        </Link>
      </section>

      {/* Featured Categories */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Browse Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.length > 0 ? (
            categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?categoryId=${category.id}`}
                className="block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 text-center"
              >
                <h3 className="text-xl font-semibold text-gray-700">
                  {category.name}
                </h3>
                <p className="text-gray-500 text-sm mt-2">
                  {category.description || "No description"}
                </p>
              </Link>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No categories available.
            </p>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          New Arrivals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No products found.
            </p>
          )}
        </div>
        <div className="text-center mt-8">
          <Link
            to="/products"
            className="inline-block bg-blue-500 text-white font-semibold py-2 px-6 rounded-full hover:bg-blue-600 transition duration-300"
          >
            View All Products
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
