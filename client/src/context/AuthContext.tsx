import React, { createContext, useState, useEffect, ReactNode } from "react";
import { User, AuthContextType, Role, Status } from "../types";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  userId: string;
  role: Role;
  vendorProfileId?: string; // Important: Add this to the decoded token interface
  exp: number;
}

// Export the context itself
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const decoded: DecodedToken = jwtDecode(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          // Check if token is expired
          const parsedUser: User = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
        } else {
          console.log("Token expired. Logging out.");
          logout();
        }
      } catch (error) {
        console.error("Failed to decode or parse token/user:", error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "ADMIN";
  const isVendor = user?.role === "VENDOR";
  const isCustomer = user?.role === "CUSTOMER";
  const isVendorApproved = isVendor && user?.vendorStatus === "APPROVED";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        isVendor,
        isCustomer,
        isVendorApproved,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
