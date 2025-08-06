import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error codes globally if needed
    if (error.response && error.response.status === 403) {
      console.warn("Forbidden: You do not have permission.");
      // Optionally redirect to login or show a message
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
