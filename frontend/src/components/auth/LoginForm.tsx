import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { setTokens, setUser, setOrgVerified } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      // Decode orgVerified from JWT or fetch from /me
      const payload = parseJwt(data.accessToken);
      setOrgVerified(Boolean(payload?.orgVerified));
      navigate('/signature');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={loading} className="mt-2">
        Sign in
      </Button>
      <p className="text-center text-sm text-gray-500">
        No account?{' '}
        <Link to="/register" className="text-brand-600 hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
};

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}
