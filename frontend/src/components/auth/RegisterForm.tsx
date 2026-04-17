import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { register } from '../../api/auth';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) errs.password = 'Password must contain an uppercase letter';
    if (!/[0-9]/.test(form.password)) errs.password = 'Password must contain a number';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string } }; message?: string };
      const msg =
        e?.response?.data?.error ??
        (e?.response?.status ? `Server error ${e.response.status}` : null) ??
        e?.message ??
        'Registration failed. Please try again.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center flex flex-col gap-4">
        <p className="text-green-600 font-medium">Account created!</p>
        <p className="text-sm text-gray-600">
          Please log in and verify your organization domain to access all features.
        </p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Full name"
        required
        value={form.name}
        error={errors.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <Input
        label="Work email"
        type="email"
        required
        value={form.email}
        error={errors.email}
        hint="Must match your organization's domain"
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      <Input
        label="Password"
        type="password"
        required
        value={form.password}
        error={errors.password}
        hint="Min 8 chars, 1 uppercase, 1 number"
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
      />
      <Input
        label="Confirm password"
        type="password"
        required
        value={form.confirm}
        error={errors.confirm}
        onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
      />
      {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}
      <Button type="submit" loading={loading} className="mt-2">
        Create account
      </Button>
      <p className="text-center text-sm text-gray-500">
        Already registered?{' '}
        <Link to="/login" className="text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
};
