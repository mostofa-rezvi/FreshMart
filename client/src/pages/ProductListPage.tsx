import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import * as productApi from "../api/product";
import * as categoryApi from "../api/category";
import { Product, Category, Status } from "../types";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import FilterSidebar from "../components/FilterSidebar"; // Corrected new import

const ProductListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const itemsPerPage = parseInt(searchParams.get("limit") || "10");

  // State for filter inputs, initialized from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("categoryId") || ""
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "createdAt"
  );
  const [order, setOrder] = useState(searchParams.get("order") || "desc");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productApi.getProducts({
        page: currentPage,
        limit: itemsPerPage,
        search: search, // Use internal state for API call
        categoryId: selectedCategory,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sortBy: sortBy,
        order: order as "asc" | "desc", // Cast to correct type
        status: "APPROVED", // Only show approved products to customers
      });
      setProducts(res.data.data);
      setTotalProducts(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    search,
    selectedCategory,
    minPrice,
    maxPrice,
    sortBy,
    order,
  ]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryApi.getCategories();
      setCategories(res.data);
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  useEffect(() => {
    // Update internal state when URL params change (e.g., from direct URL or back/forward)
    setSearch(searchParams.get("search") || "");
    setSelectedCategory(searchParams.get("categoryId") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setSortBy(searchParams.get("sortBy") || "createdAt");
    setOrder(searchParams.get("order") || "desc");

    fetchProducts();
  }, [searchParams, fetchProducts]); // Depend on searchParams directly

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handlePageChange = (page: number) => {
    setSearchParams(
      (prev) => {
        prev.set("page", page.toString());
        return prev;
      },
      { replace: true }
    );
  };

  const applyFilters = () => {
    const newParams: Record<string, string> = {};
    if (search) newParams.search = search;
    if (selectedCategory) newParams.categoryId = selectedCategory;
    if (minPrice) newParams.minPrice = minPrice;
    if (maxPrice) newParams.maxPrice = maxPrice;
    if (sortBy) newParams.sortBy = sortBy;
    if (order) newParams.order = order;
    newParams.page = "1"; // Reset to first page on new filters/sort

    setSearchParams(newParams, { replace: true });
  };

  // For lazy loading: Intersection Observer to potentially trigger loading more items
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          // This is for infinite scroll. For the current pagination setup, it's just a placeholder.
          // To implement infinite scroll, you'd load more items and append to 'products' array
          // instead of replacing it, and remove pagination buttons.
          if (entries[0].isIntersecting && currentPage < totalPages) {
            console.log(
              "Last product visible. Would load next page in infinite scroll scenario."
            );
          }
        },
        { threshold: 0.5 }
      );

      if (node) observer.current.observe(node);
    },
    [loading, currentPage, totalPages]
  );

  if (error)
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Filters Sidebar */}
      <FilterSidebar
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        sortBy={sortBy}
        setSortBy={setSortBy}
        order={order}
        setOrder={setOrder}
        categories={categories}
        applyFilters={applyFilters}
      />

      {/* Product List */}
      <div className="w-full md:w-3/4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          All Products ({totalProducts})
        </h1>
        {loading ? (
          <div className="text-center py-10">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No products found matching your criteria.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  ref={
                    index === products.length - 1 ? lastProductElementRef : null
                  }
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
