import React from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { DomainVerification } from '../components/organization/DomainVerification';
import { OrganizationMembers } from '../components/organization/OrganizationMembers';
import { useAuthStore } from '../store/authStore';

export const OrganizationPage: React.FC = () => {
  const { user, orgVerified } = useAuthStore();
  const location = useLocation();
  const needsVerification = (location.state as { needsVerification?: boolean })?.needsVerification;

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your organization's domain verification and team members.
        </p>
      </div>

      {needsVerification && !orgVerified && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertCircle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-800">
            You must verify your organization domain before you can use signature and stamp tools.
            Complete verification below.
          </p>
        </div>
      )}

      {/* Domain verification section */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">
          Domain Verification
        </h2>
        <DomainVerification />
      </section>

      {/* Members section (admins only) */}
      {user?.role === 'admin' && orgVerified && (
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
