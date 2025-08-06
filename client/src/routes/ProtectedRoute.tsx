import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // Updated import path
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
    if (
      allowedRoles &&
      allowedRoles.includes("VENDOR") &&
      window.location.pathname !== "/vendor-dashboard"
    ) {
      // If the route is specifically for VENDORs but not the dashboard, and they are pending, let them
      // pass through to handle it within the component, or redirect here if strictly no access.
      // For this architecture, we'll redirect to /vendor-pending if they try to access a generic vendor route.
      return <Navigate to="/vendor-pending" replace />;
    }
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
