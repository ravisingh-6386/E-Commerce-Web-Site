import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShoppingCart, Search, Sun, Moon, Menu, X,
  Bell, User, LogOut, Package, LayoutDashboard, Shield,
  Heart, MessageSquare, ChevronDown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { logout } from '../../store/slices/authSlice';
import { toggleCart } from '../../store/slices/cartSlice';
import { selectCartCount } from '../../store/slices/cartSlice';
import useAuth from '../../hooks/useAuth';

const CATEGORIES = [
  { label: 'Car Parts', value: 'car-parts', icon: '🚗' },
  { label: 'Bike Parts', value: 'bike-parts', icon: '🏍️' },
  { label: 'Superbike Parts', value: 'superbike-parts', icon: '⚡' },
  { label: 'Engine Parts', value: 'engine-parts', icon: '⚙️' },
  { label: 'Accessories', value: 'accessories', icon: '🔧' },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAdmin, isSeller } = useAuth();
  const cartCount = useSelector(selectCartCount);
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-dark-900 shadow-sm border-b border-gray-200 dark:border-dark-700">
      {/* Top bar */}
      <div className="container-app">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MP</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              Moto<span className="text-primary-600">Parts</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search parts, brands, models…"
                className="input pr-12"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
              >
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Cart */}
            <button
              onClick={() => dispatch(toggleCart())}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* User menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((p) => !p)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=ef4444&color=fff`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 card shadow-lg py-1 animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-700">
                      <p className="font-semibold text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <NavDropdownItem to="/profile" icon={<User size={16} />} label="Profile" onClick={() => setUserMenuOpen(false)} />
                    <NavDropdownItem to="/orders" icon={<Package size={16} />} label="My Orders" onClick={() => setUserMenuOpen(false)} />
                    <NavDropdownItem to="/wishlist" icon={<Heart size={16} />} label="Wishlist" onClick={() => setUserMenuOpen(false)} />
                    <NavDropdownItem to="/messages" icon={<MessageSquare size={16} />} label="Messages" onClick={() => setUserMenuOpen(false)} />
                    {isSeller && (
                      <NavDropdownItem to="/seller/dashboard" icon={<LayoutDashboard size={16} />} label="Seller Dashboard" onClick={() => setUserMenuOpen(false)} />
                    )}
                    {isAdmin && (
                      <NavDropdownItem to="/admin" icon={<Shield size={16} />} label="Admin Panel" onClick={() => setUserMenuOpen(false)} />
                    )}
                    <div className="border-t border-gray-100 dark:border-dark-700 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2 px-4 hidden sm:flex">
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 md:hidden"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Category Nav */}
        <nav className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              to={`/products?category=${cat.value}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              <span>{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
          {isSeller && (
            <Link
              to="/products/create"
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              + List a Part
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 animate-fade-in">
          <div className="container-app py-3 space-y-2">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search parts…"
                className="input pr-10"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </button>
            </form>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                to={`/products?category=${cat.value}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800"
              >
                <span>{cat.icon}</span> {cat.label}
              </Link>
            ))}
            {!user && (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavDropdownItem({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
