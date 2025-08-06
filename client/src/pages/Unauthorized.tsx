import React from "react";
import { Link } from "react-router-dom";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-lg mx-auto">
        <ExclamationCircleIcon className="h-24 w-24 text-red-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Unauthorized Access
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          You do not have the necessary permissions to view this page.
        </p>
        <Link
          to="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
