import React, { useState, useEffect, useCallback } from "react";
import { Product, VendorProfile, Category, Status, Order } from "../types"; // Import Order
import * as productApi from "../api/product";
import * as vendorApi from "../api/vendor";
import * as categoryApi from "../api/category";
import * as orderApi from "../api/order";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/helpers"; // Import helper

// Zod schema for Category creation/update
const categoryFormSchema = z.object({
  name: z
    .string()
    .min(3, "Category name is required and must be at least 3 characters."),
  description: z.string().optional(),
});
type CategoryFormInputs = z.infer<typeof categoryFormSchema>;

const AdminDashboard: React.FC = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // Explicitly type as Order[]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "vendors" | "products" | "categories" | "orders"
  >("vendors");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormInputs>({
    resolver: zodResolver(categoryFormSchema),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vendorsRes, productsRes, categoriesRes, ordersRes] =
        await Promise.all([
          vendorApi.getVendors(),
          productApi.getProducts({
            limit: 100,
            sortBy: "createdAt",
            order: "desc",
            status: "all",
          }), // Admin can see all statuses
          categoryApi.getCategories(),
          orderApi.getAllOrders(),
        ]);
      setVendors(vendorsRes.data);
      setProducts(productsRes.data.data); // productsRes.data.data because getProducts returns paginated data
      setCategories(categoriesRes.data);
      setAllOrders(ordersRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApproveRejectVendor = async (
    vendorId: string,
    status: Status
  ) => {
    try {
      await vendorApi.approveRejectVendor(vendorId, status);
      alert(`Vendor status updated to ${status}`);
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update vendor status.");
    }
  };

  const handleApproveRejectProduct = async (
    productId: string,
    status: Status
  ) => {
    try {
      await productApi.approveRejectProduct(productId, status);
      alert(`Product status updated to ${status}`);
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update product status.");
    }
  };

  const handleCreateCategory = async (data: CategoryFormInputs) => {
    try {
      await categoryApi.createCategory(data.name, data.description);
      alert("Category created successfully!");
      reset(); // Clear form
      fetchData(); // Refresh categories
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create category.");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? This cannot be undone."
      )
    ) {
      try {
        await categoryApi.deleteCategory(categoryId);
        alert("Category deleted successfully!");
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete category.");
      }
    }
  };

  // Basic revenue calculation (mock)
  const totalRevenue = allOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  if (loading)
    return <div className="text-center py-10">Loading admin dashboard...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Admin Dashboard
      </h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-700">Total Vendors</h2>
          <p className="text-3xl font-bold text-blue-600">{vendors.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            Total Products
          </h2>
          <p className="text-3xl font-bold text-green-600">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            Platform Revenue (Mock)
          </h2>
          <p className="text-3xl font-bold text-purple-600">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        <button
          className={`py-2 px-4 text-lg font-medium ${
            activeTab === "vendors"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("vendors")}
        >
          Manage Vendors
        </button>
        <button
          className={`py-2 px-4 text-lg font-medium ${
            activeTab === "products"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("products")}
        >
          Manage Products
        </button>
        <button
          className={`py-2 px-4 text-lg font-medium ${
            activeTab === "categories"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("categories")}
        >
          Manage Categories
        </button>
        <button
          className={`py-2 px-4 text-lg font-medium ${
            activeTab === "orders"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          View All Orders
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "vendors" && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Vendor Approval Requests
            </h2>
            <div className="overflow-x-auto">
              {vendors.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shop Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vendors.map((vendor) => (
                      <tr key={vendor.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {vendor.shopName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {vendor.user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vendor.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : vendor.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vendor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {vendor.status === "PENDING" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproveRejectVendor(
                                    vendor.id,
                                    "APPROVED"
                                  )
                                }
                                className="text-green-600 hover:text-green-900 mr-4"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleApproveRejectVendor(
                                    vendor.id,
                                    "REJECTED"
                                  )
                                }
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {vendor.status === "APPROVED" && (
                            <button
                              onClick={() =>
                                handleApproveRejectVendor(
                                  vendor.id,
                                  "INACTIVE"
                                )
                              }
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Deactivate
                            </button>
                          )}
                          {(vendor.status === "REJECTED" ||
                            vendor.status === "INACTIVE") && (
                            <button
                              onClick={() =>
                                handleApproveRejectVendor(
                                  vendor.id,
                                  "APPROVED"
                                )
                              }
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  No vendor requests.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Manage Products (All Statuses)
            </h2>
            <div className="overflow-x-auto">
              {products.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.vendor?.shopName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : product.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {product.status === "PENDING" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproveRejectProduct(
                                    product.id,
                                    "APPROVED"
                                  )
                                }
                                className="text-green-600 hover:text-green-900 mr-4"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleApproveRejectProduct(
                                    product.id,
                                    "REJECTED"
                                  )
                                }
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {product.status === "APPROVED" && (
                            <button
                              onClick={() =>
                                handleApproveRejectProduct(
                                  product.id,
                                  "INACTIVE"
                                )
                              }
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Deactivate
                            </button>
                          )}
                          {(product.status === "REJECTED" ||
                            product.status === "INACTIVE") && (
                            <button
                              onClick={() =>
                                handleApproveRejectProduct(
                                  product.id,
                                  "APPROVED"
                                )
                              }
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  No products found.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Manage Categories
            </h2>

            <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
              <h3 className="text-xl font-semibold mb-4">Add New Category</h3>
              <form
                onSubmit={handleSubmit(handleCreateCategory)}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="categoryName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="categoryName"
                    {...register("name")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="categoryDescription"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="categoryDescription"
                    {...register("description")}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-1" /> Add Category
                </button>
              </form>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Existing Categories
            </h3>
            <div className="overflow-x-auto">
              {categories.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.description || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {/* Add update functionality here if needed */}
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  No categories found.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              All Orders
            </h2>
            <div className="space-y-6">
              {allOrders.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  No orders placed yet.
                </p>
              ) : (
                allOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-lg">
                        Order ID: {order.id.substring(0, 8)}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-medium ${
                          order.status === "DELIVERED"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p>Customer: {order.customer.email}</p>
                    <p>Total Amount: {formatCurrency(order.totalAmount)}</p>
                    <p>
                      Items:{" "}
                      {order.orderItems
                        .map((item) => item.product.name)
                        .join(", ")}
                    </p>
                    {/* Link to full order details */}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
