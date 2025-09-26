import React from "react";

export const BadgeManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Badge Management</h1>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800">
          Create Badge
        </button>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <p className="text-gray-500">
            Badge management functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
};
