import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import {
  ShoppingCartIcon,
  UserCircleIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  PowerIcon,
} from "@heroicons/react/24/outline"; // For icons

const Header: React.FC = () => {
  const {
    user,
    isAuthenticated,
    logout,
    isAdmin,
    isVendor,
    isCustomer,
    isVendorApproved,
  } = useAuth();
  const { cartItemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <header className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          FreshMart
        </Link>

        <nav className="flex items-center space-x-4">
          <Link
            to="/products"
            className="hover:text-gray-300 flex items-center"
          >
            <BuildingStorefrontIcon className="h-5 w-5 mr-1" /> Products
          </Link>

          {isCustomer && (
            <Link
              to="/cart"
              className="hover:text-gray-300 flex items-center relative"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-1" /> Cart
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          )}

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin-dashboard"
                  className="hover:text-gray-300 flex items-center"
                >
                  <UserGroupIcon className="h-5 w-5 mr-1" /> Admin Dashboard
                </Link>
              )}
              {isVendor && isVendorApproved && (
                <Link
                  to="/vendor-dashboard"
                  className="hover:text-gray-300 flex items-center"
                >
                  <BuildingStorefrontIcon className="h-5 w-5 mr-1" /> Vendor
                  Dashboard
                </Link>
              )}
              {isCustomer && (
                <Link
                  to="/my-orders"
                  className="hover:text-gray-300 flex items-center"
                >
                  <HomeIcon className="h-5 w-5 mr-1" /> My Orders
                </Link>
              )}
              <span className="flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-1" /> Hello,{" "}
                {user?.email.split("@")[0]}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded flex items-center"
              >
                <PowerIcon className="h-4 w-4 mr-1" /> Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
            >
              Login / Register
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
