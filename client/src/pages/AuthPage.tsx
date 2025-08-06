import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // Corrected import path
import * as authApi from "../api/auth";
import AuthForms, {
  RegisterFormInputs,
  LoginFormInputs,
} from "../components/AuthForms"; // Import AuthForms and its types
import { useForm } from "react-hook-form"; // Import useForm to handle local resets
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Role } from "../types"; // Keep Role import because `register` uses it.

// Zod schemas for validation (re-defining them here for AuthPage's internal useForm calls for resets)
// AuthForms component itself uses these same schemas internally.
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["CUSTOMER", "VENDOR", "ADMIN"]).default("CUSTOMER"),
  shopName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const AuthPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Separate useForm hooks for register and login, only for `reset` method access
  const { reset: resetRegisterForm } = useForm<RegisterFormInputs>({
    resolver: Resolver(registerSchema),
  });
  const { reset: resetLoginForm } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmitRegister = async (data: RegisterFormInputs) => {
    setLoading(true);
    setError(null);
    try {
      if (data.role === "VENDOR" && !data.shopName) {
        throw new Error("Shop name is required for vendor registration.");
      }
      const res = await authApi.register(
        data.email,
        data.password,
        data.role as Role,
        data.shopName
      );
      login(res.data.token, res.data.user);
      resetRegisterForm(); // Reset here
      if (
        res.data.user.role === "VENDOR" &&
        res.data.user.vendorStatus === "PENDING"
      ) {
        navigate("/vendor-pending");
      } else if (res.data.user.role === "ADMIN") {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmitLogin = async (data: LoginFormInputs) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(data.email, data.password);
      login(res.data.token, res.data.user);
      resetLoginForm(); // Reset here
      if (
        res.data.user.role === "VENDOR" &&
        res.data.vendorStatus === "PENDING"
      ) {
        navigate("/vendor-pending");
      } else if (res.data.user.role === "ADMIN") {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setError(null); // Clear errors on toggle
    resetLoginForm(); // Clear form on toggle
    resetRegisterForm(); // Clear form on toggle
  };

  return (
    <AuthForms
      isRegister={isRegister}
      loading={loading}
      onSubmitRegister={onSubmitRegister}
      onSubmitLogin={onSubmitLogin}
      error={error}
      toggleForm={toggleForm}
      // No longer passing reset functions as props to AuthForms
    />
  );
};

export default AuthPage;
function Resolver(registerSchema: z.ZodObject<{ email: z.ZodString; password: z.ZodString; role: z.ZodDefault<z.ZodEnum<{ CUSTOMER: "CUSTOMER"; VENDOR: "VENDOR"; ADMIN: "ADMIN"; }>>; shopName: z.ZodOptional<z.ZodString>; }, z.core.$strip>): import("react-hook-form").Resolver<{ email: string; password: string; role: "CUSTOMER" | "VENDOR" | "ADMIN"; shopName?: string | undefined; }, any, { email: string; password: string; role: "CUSTOMER" | "VENDOR" | "ADMIN"; shopName?: string | undefined; }> | undefined {
  throw new Error("Function not implemented.");
}

