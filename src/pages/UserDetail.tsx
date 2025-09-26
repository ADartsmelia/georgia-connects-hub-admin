import React from "react";
import { useParams } from "react-router-dom";

export const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
        <p className="mt-2 text-gray-600">User ID: {id}</p>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <p className="text-gray-500">
            User detail functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
};
