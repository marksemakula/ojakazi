import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SignaturePage } from './pages/SignaturePage';
import { StampPage } from './pages/StampPage';
import { OrganizationPage } from './pages/OrganizationPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes (no layout chrome) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public home with layout */}
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />

        {/* Public: no account needed */}
        <Route
          path="/signature"
          element={
            <Layout>
              <SignaturePage />
            </Layout>
          }
        />

        {/* Public: no account needed */}
        <Route
          path="/stamp"
          element={
            <Layout>
              <StampPage />
            </Layout>
          }
        />

        {/* Protected: requires login only */}
        <Route
          path="/organization"
          element={
            <ProtectedRoute>
              <Layout>
                <OrganizationPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
