import React, { useState, useEffect, useCallback } from "react";
import { Product, Order, Category, Status } from "../types"; // Removed Status and UseFormReturn as they are not directly used in this component's JSX
import * as vendorApi from "../api/vendor";
import * as productApi from "../api/product";
import * as categoryApi from "../api/category";
import * as orderApi from "../api/order";
import { useAuth } from "../hooks/useAuth"; // Corrected import path
import { useForm } from "react-hook-form"; // Keep useForm only for this component's needs
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ProductFormInputs } from "../schemas/productSchema"; // Corrected import path for ProductFormInputs
import { productFormSchema } from "../schemas/productSchema"; // Corrected import path for productFormSchema
import VendorProductForm from "../components/VendorProductForm"; // Import component
import { formatCurrency } from "../utils/helpers"; // Import helper

// Zod schema for Vendor Profile update
const vendorProfileSchema = z.object({
  shopName: z.string().min(3, "Shop name is required."),
  shopDescription: z.string().optional(),
});
type VendorProfileInputs = z.infer<typeof vendorProfileSchema>;

const VendorDashboard: React.FC = () => {
  const { user, isVendorApproved } = useAuth();
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [vendorOrders, setVendorOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "profile">(
    "products"
  );
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form for products - using the imported schema
  const productFormMethods = useForm<ProductFormInputs>({
    resolver: Resolver(productFormSchema), // Use the imported schema
  });

  // Form for vendor profile
  const vendorProfileFormMethods = useForm<VendorProfileInputs>({
    resolver: zodResolver(vendorProfileSchema),
  });

  const fetchVendorData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user || !isVendorApproved) {
        setLoading(false);
        return;
      }
      const [profileRes, ordersRes, categoriesRes] = await Promise.all([
        vendorApi.getMyVendorProfile(),
        orderApi.getVendorOrders(),
        categoryApi.getCategories(),
      ]);
      setVendorProfile(profileRes.data);
      setVendorProducts(profileRes.data.products);
      setVendorOrders(ordersRes.data);
      setCategories(categoriesRes.data);

      // Set default values for vendor profile form
      vendorProfileFormMethods.setValue("shopName", profileRes.data.shopName);
      vendorProfileFormMethods.setValue(
        "shopDescription",
        profileRes.data.shopDescription
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch vendor data.");
    } finally {
      setLoading(false);
    }
  }, [user, isVendorApproved, vendorProfileFormMethods]);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  const handleProductSubmit = async (data: ProductFormInputs) => {
    try {
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, data);
        alert("Product updated successfully! Awaiting re-approval.");
      } else {
        await productApi.createProduct(data as any);
        alert("Product created successfully! Awaiting admin approval.");
      }
      setEditingProduct(null);
      productFormMethods.reset();
      fetchVendorData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save product.");
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    // Use setValue from productFormMethods
    productFormMethods.setValue("name", product.name);
    productFormMethods.setValue("description", product.description || "");
    productFormMethods.setValue("price", product.price);
    productFormMethods.setValue("stock", product.stock);
    productFormMethods.setValue("categoryId", product.categoryId);
    productFormMethods.setValue("imageUrl", product.imageUrl || "");
  };

  const handleCancelEditProduct = () => {
    setEditingProduct(null);
    productFormMethods.reset();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productApi.deleteProduct(productId);
        alert("Product deleted successfully!");
        fetchVendorData();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete product.");
      }
    }
  };

  const handleUpdateVendorProfile = async (data: VendorProfileInputs) => {
    try {
      await vendorApi.updateMyVendorProfile(data);
      alert("Shop profile updated successfully!");
      fetchVendorData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update shop profile.");
    }
  };

  if (loading)
    return <div className="text-center py-10">Loading vendor dashboard...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  if (!user || !isVendorApproved) {
    // This case should ideally be handled by ProtectedRoute. If reached, it's a fallback.
    return (
      <div className="text-center py-10 text-gray-500">
        Access Denied. Your vendor account might not be approved yet.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Vendor Dashboard: {vendorProfile?.shopName}
      </h1>

      {/* Overview Stats (basic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-700">Your Products</h2>
          <p className="text-3xl font-bold text-blue-600">
            {vendorProducts.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            Pending Orders
          </h2>
          <p className="text-3xl font-bold text-yellow-600">
            {
              vendorOrders.filter(
                (o) => o.status === "PENDING" || o.status === "PROCESSING"
              ).length
            }
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
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
            activeTab === "orders"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          View Orders
        </button>
        <button
          className={`py-2 px-4 text-lg font-medium ${
            activeTab === "profile"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          Shop Profile
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "products" && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <VendorProductForm
              categories={categories}
              editingProduct={editingProduct}
              onSubmit={handleProductSubmit}
              onCancelEdit={handleCancelEditProduct}
              formMethods={productFormMethods}
            />

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Your Products List
            </h3>
            <div className="overflow-x-auto">
              {vendorProducts.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
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
                    {vendorProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
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
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
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
                  You have no products yet. Add one above!
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Your Orders
            </h2>
            <div className="space-y-6">
              {vendorOrders.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  No orders for your products yet.
                </p>
              ) : (
                vendorOrders.map((order) => (
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
                            : order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
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
                    <div className="mt-4 text-right">
                      <button
                        onClick={() => {
                          /* Implement navigation to order details */
                        }}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Your Shop Profile
            </h2>
            {vendorProfile ? (
              <form
                onSubmit={vendorProfileFormMethods.handleSubmit(
                  handleUpdateVendorProfile
                )}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="shopName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Shop Name
                  </label>
                  <input
                    type="text"
                    id="shopName"
                    {...vendorProfileFormMethods.register("shopName")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {vendorProfileFormMethods.formState.errors.shopName && (
                    <p className="text-red-500 text-xs mt-1">
                      {
                        vendorProfileFormMethods.formState.errors.shopName
                          .message
                      }
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="shopDescription"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="shopDescription"
                    {...vendorProfileFormMethods.register("shopDescription")}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <p className="text-lg mb-2">
                  <strong>Status:</strong>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ml-2 ${
                      vendorProfile.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : vendorProfile.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {vendorProfile.status}
                  </span>
                </p>
                <p className="text-lg mb-2">
                  <strong>Registered Email:</strong> {vendorProfile.user.email}
                </p>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Update Profile
                </button>
              </form>
            ) : (
              <p className="text-gray-500">No vendor profile found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
function Resolver(productFormSchema: z.ZodObject<{ name: z.ZodString; description: z.ZodOptional<z.ZodString>; price: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>; stock: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>; categoryId: z.ZodString; imageUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>; }, z.core.$strip>): import("react-hook-form").Resolver<{ name: string; price: number; stock: number; categoryId: string; description?: string | undefined; imageUrl?: string | undefined; }, any, { name: string; price: number; stock: number; categoryId: string; description?: string | undefined; imageUrl?: string | undefined; }> | undefined {
  throw new Error("Function not implemented.");
}

