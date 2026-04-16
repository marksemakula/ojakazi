import React from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';

export const RegisterPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
      <p className="text-sm text-gray-500 mb-6">
        Your email domain determines your organization. The first registrant becomes admin.
      </p>
      <RegisterForm />
    </div>
  </div>
);
