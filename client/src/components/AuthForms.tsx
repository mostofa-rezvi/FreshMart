import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// Removed: import { Role } from '../types'; // 'Role' is defined but never used (handled by z.enum literal string array)

// Zod schemas for validation
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["CUSTOMER", "VENDOR", "ADMIN"]).default("CUSTOMER"), // FIX: z.enum now takes the array directly
  shopName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterFormInputs = z.infer<typeof registerSchema>;
export type LoginFormInputs = z.infer<typeof loginSchema>;

interface AuthFormsProps {
  isRegister: boolean;
  loading: boolean;
  onSubmitRegister: (data: RegisterFormInputs) => void;
  onSubmitLogin: (data: LoginFormInputs) => void;
  error: string | null;
  toggleForm: () => void;
  // Removed `resetRegisterForm` and `resetLoginForm` props as they are handled by AuthPage
}

const AuthForms: React.FC<AuthFormsProps> = ({
  isRegister,
  loading,
  onSubmitRegister,
  onSubmitLogin,
  error,
  toggleForm,
}) => {
  const {
    register: registerForm,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    watch,
  } = useForm<RegisterFormInputs>({
    resolver: Resolver(registerSchema),
  });

  const {
    register: loginForm,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const selectedRole = watch("role");

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-center mb-6">
        {isRegister ? "Register" : "Login"} to FreshMart
      </h2>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {isRegister ? (
        <form
          onSubmit={handleRegisterSubmit(onSubmitRegister)}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="register-email"
              type="email"
              {...registerForm("email")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {registerErrors.email && (
              <p className="text-red-500 text-xs mt-1">
                {registerErrors.email.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="register-password"
              type="password"
              {...registerForm("password")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {registerErrors.password && (
              <p className="text-red-500 text-xs mt-1">
                {registerErrors.password.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700"
            >
              Register as:
            </label>
            <select
              id="role"
              {...registerForm("role")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="VENDOR">Vendor</option>
              <option value="ADMIN">Admin</option> {/* REMOVE FOR PRODUCTION */}
            </select>
            {registerErrors.role && (
              <p className="text-red-500 text-xs mt-1">
                {registerErrors.role.message}
              </p>
            )}
          </div>
          {selectedRole === "VENDOR" && (
            <div>
              <label
                htmlFor="shopName"
                className="block text-sm font-medium text-gray-700"
              >
                Shop Name
              </label>
              <input
                id="shopName"
                type="text"
                {...registerForm("shopName")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {registerErrors.shopName && (
                <p className="text-red-500 text-xs mt-1">
                  {registerErrors.shopName.message}
                </p>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLoginSubmit(onSubmitLogin)} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              {...loginForm("email")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {loginErrors.email && (
              <p className="text-red-500 text-xs mt-1">
                {loginErrors.email.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              {...loginForm("password")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {loginErrors.password && (
              <p className="text-red-500 text-xs mt-1">
                {loginErrors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-600">
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={toggleForm}
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          {isRegister ? "Login" : "Register"}
        </button>
      </p>
    </div>
  );
};

export default AuthForms;
function Resolver(registerSchema: z.ZodObject<{ email: z.ZodString; password: z.ZodString; role: z.ZodDefault<z.ZodEnum<{ CUSTOMER: "CUSTOMER"; VENDOR: "VENDOR"; ADMIN: "ADMIN"; }>>; shopName: z.ZodOptional<z.ZodString>; }, z.core.$strip>): import("react-hook-form").Resolver<{ email: string; password: string; role: "CUSTOMER" | "VENDOR" | "ADMIN"; shopName?: string | undefined; }, any, { email: string; password: string; role: "CUSTOMER" | "VENDOR" | "ADMIN"; shopName?: string | undefined; }> | undefined {
  throw new Error("Function not implemented.");
}

