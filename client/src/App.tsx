import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { useAuth } from "./hooks/useAuth"; // Updated import path

// Layout Components
import Header from "./components/Header";
import Footer from "./components/Footer";

// Pages
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import VendorPendingApproval from "./pages/VendorPendingApproval";

// Protected Route Component
import ProtectedRoute from "./routes/ProtectedRoute";

const AppContent: React.FC = () => {
  const {
    loading,
    isAuthenticated,
    isAdmin,
    isVendor,
    isCustomer,
    isVendorApproved,
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading application...
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route
            path="/auth"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Customer Routes */}
          <Route element={<ProtectedRoute allowedRoles={["CUSTOMER"]} />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/my-orders" element={<OrderTrackingPage />} />
            {/* Specific order details accessible by customer, vendor (if their product is in it), or admin */}
            <Route path="/orders/:id" element={<OrderTrackingPage />} />
          </Route>

          {/* Vendor Routes */}
          <Route element={<ProtectedRoute allowedRoles={["VENDOR"]} />}>
            <Route path="/vendor-pending" element={<VendorPendingApproval />} />
            {/* Vendor dashboard access only if approved */}
            <Route
              path="/vendor-dashboard"
              element={
                isVendorApproved ? (
                  <VendorDashboard />
                ) : (
                  <Navigate to="/vendor-pending" replace />
                )
              }
            />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            {/* Admin can view any order details as well */}
            <Route path="/admin/orders/:id" element={<OrderTrackingPage />} />
          </Route>

          {/* Redirects based on role after login if they hit root or generic dashboard path */}
          {isAuthenticated && (
            <Route
              path="/dashboard"
              element={
                isAdmin ? (
                  <Navigate to="/admin-dashboard" replace />
                ) : isVendor && isVendorApproved ? (
                  <Navigate to="/vendor-dashboard" replace />
                ) : isVendor && !isVendorApproved ? (
                  <Navigate to="/vendor-pending" replace />
                ) : isCustomer ? (
                  <Navigate to="/my-orders" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          )}

          {/* Catch-all for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
