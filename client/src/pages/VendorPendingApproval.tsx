import React from "react";
import { useAuth } from "../hooks/useAuth"; 

const VendorPendingApproval: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Vendor Account Status
        </h1>
        {user?.vendorStatus === "PENDING" ? (
          <>
            <p className="text-xl text-yellow-600 mb-4">
              Your vendor account is currently{" "}
              <span className="font-bold">PENDING APPROVAL</span>
            </p>
            <p className="text-gray-700 mb-6">
              Thank you for registering your shop! Your account is now awaiting
              review by our administrators. We will notify you via email once
              your shop is approved.
            </p>
            <p className="text-gray-600 text-sm">
              You will not be able to add or manage products until your account
              is approved.
            </p>
          </>
        ) : user?.vendorStatus === "REJECTED" ? (
          <>
            <p className="text-xl text-red-600 mb-4">
              Your vendor account has been{" "}
              <span className="font-bold">REJECTED</span>.
            </p>
            <p className="text-gray-700 mb-6">
              Unfortunately, your vendor application was not approved. Please
              contact support for more information or to appeal the decision.
            </p>
          </>
        ) : (
          <>
            <p className="text-xl text-gray-600 mb-4">
              You are not registered as a vendor or your status is unknown.
            </p>
            <p className="text-gray-700 mb-6">
              Please ensure you have registered with the 'Vendor' role.
            </p>
          </>
        )}
        <button
          onClick={() => window.history.back()}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default VendorPendingApproval;
