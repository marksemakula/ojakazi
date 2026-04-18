import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PenLine, Stamp, Building2, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/auth';

const publicNavItems = [
  { to: '/signature', icon: PenLine, label: 'Signature' },
  { to: '/stamp', icon: Stamp, label: 'Stamps' },
];

const authNavItems = [
  { to: '/organization', icon: Building2, label: 'Organization' },
];

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, refreshToken, logout: clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (refreshToken) await logout(refreshToken);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const visibleNavItems = isAuthenticated
    ? [...publicNavItems, ...authNavItems]
    : publicNavItems;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-6 shadow-sm">
      <NavLink to="/" className="flex items-center gap-2 font-bold text-brand-600 text-lg shrink-0">
        <PenLine size={22} />
        Ojakazi
      </NavLink>

      <nav className="flex items-center gap-1 flex-1">
        {visibleNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        {user && (
          <span className="text-sm text-gray-600 hidden sm:inline">{user.name}</span>
        )}

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
};
