import { useSelector, useDispatch } from 'react-redux';
import { logout, fetchMe } from '../store/slices/authSlice';
import { useEffect } from 'react';

const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, loading, error, initialized } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token && !user && !loading) {
      dispatch(fetchMe());
    }
  }, [token, user, loading, dispatch]);

  const handleLogout = () => dispatch(logout());

  const isAdmin = user?.role === 'admin';
  const isSeller =
    user?.role === 'seller' ||
    user?.role === 'admin' ||
    user?.sellerStatus === 'approved';

  return { user, token, loading, error, initialized, isAdmin, isSeller, handleLogout };
};

export default useAuth;
