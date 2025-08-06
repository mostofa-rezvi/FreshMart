import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // Updated import path
import * as authApi from "../api/auth";
import AuthForms, {
  RegisterFormInputs,
  LoginFormInputs,
} from "../components/AuthForms"; // Import the new component and types

const AuthPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

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
        data.role,
        data.shopName
      );
      login(res.data.token, res.data.user);
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
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setError(null); // Clear errors on toggle
  };

  return (
    <AuthForms
      isRegister={isRegister}
      loading={loading}
      onSubmitRegister={onSubmitRegister}
      onSubmitLogin={onSubmitLogin}
      error={error}
      toggleForm={toggleForm}
    />
  );
};

export default AuthPage;
