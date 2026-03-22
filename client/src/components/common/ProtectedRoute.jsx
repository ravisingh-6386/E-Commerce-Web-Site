import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { PageLoader } from './Loader';

export default function ProtectedRoute({ requireSeller = false, requireAdmin = false }) {
  const { user, token, initialized, isAdmin, isSeller } = useAuth();

  if (!initialized) return <PageLoader />;

  if (!token || !user) return <Navigate to="/login" replace />;

  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  if (requireSeller && !isSeller) return <Navigate to="/profile" replace />;

  return <Outlet />;
}
