import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // Corrected import path
import { Role } from "../types";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading...
      </div>
    ); // Or a spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Handle vendor pending approval differently if specific routes require approved status
  if (
    user?.role === "VENDOR" &&
    user.vendorStatus === "PENDING" &&
    window.location.pathname !== "/vendor-pending" &&
    window.location.pathname !== "/unauthorized"
  ) {
    // If a pending vendor tries to access any protected route *other than* vendor-pending or unauthorized,
    // redirect them to the pending page. This prevents them from seeing parts of the dashboard before approval.
    // For general vendor routes (e.g., /vendor-dashboard), if they are pending, redirect to vendor-pending.
    // However, if the allowedRoles explicitly include 'VENDOR' and it's for a specific page that pending vendors
    // *are* allowed to see (e.g., specific vendor onboarding steps), you'd refine this.
    // For this app, the '/vendor-dashboard' route specifically checks `isVendorApproved`,
    // so this general check for pending vendors is still useful.
    if (allowedRoles && allowedRoles.includes("VENDOR")) {
      // If this route is meant for Vendors
      // If it's a vendor attempting to access a general vendor-only route, and they are pending,
      // send them to the pending page.
      return <Navigate to="/vendor-pending" replace />;
    }
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
