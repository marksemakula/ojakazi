import React from 'react';
import { OrganizationMembers } from '../components/organization/OrganizationMembers';
import { useAuthStore } from '../store/authStore';

export const OrganizationPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your organization's team members.
        </p>
      </div>

      {/* Members section (admins only) */}
      {user?.role === 'admin' && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">
            Team Members
          </h2>
          <OrganizationMembers />
        </section>
      )}
    </div>
  );
};
