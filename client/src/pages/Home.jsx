import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Star, Zap } from 'lucide-react';
import { fetchFeaturedProducts } from '../store/slices/productSlice';
import ProductCard from '../components/product/ProductCard';
import Loader from '../components/common/Loader';

const HERO_CATEGORIES = [
  { label: 'Car Parts', icon: '🚗', to: '/products?category=car-parts', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { label: 'Bike Parts', icon: '🏍️', to: '/products?category=bike-parts', color: 'bg-green-50 dark:bg-green-900/20' },
  { label: 'Superbike', icon: '⚡', to: '/products?category=superbike-parts', color: 'bg-purple-50 dark:bg-purple-900/20' },
  { label: 'Engine Parts', icon: '⚙️', to: '/products?category=engine-parts', color: 'bg-orange-50 dark:bg-orange-900/20' },
  { label: 'Accessories', icon: '🔧', to: '/products?category=accessories', color: 'bg-pink-50 dark:bg-pink-900/20' },
  { label: 'All Products', icon: '🛒', to: '/products', color: 'bg-gray-50 dark:bg-gray-800' },
];

const FEATURES = [
  { icon: <ShieldCheck className="text-primary-600" size={28} />, title: 'Verified Sellers', desc: 'All sellers go through our verification process.' },
  { icon: <Truck className="text-primary-600" size={28} />, title: 'Fast Shipping', desc: 'Most orders ship within 1-3 business days.' },
  { icon: <RefreshCw className="text-primary-600" size={28} />, title: 'Easy Returns', desc: '30-day hassle-free return on eligible parts.' },
  { icon: <Star className="text-primary-600" size={28} />, title: 'Genuine Reviews', desc: 'Verified-purchase reviews you can trust.' },
];

export default function Home() {
  const dispatch = useDispatch();
  const { featured, loading } = useSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
  }, [dispatch]);

  return (
    <div className="animate-fade-in">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-gray-900 via-dark-900 to-primary-900 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, white 1px, transparent 0)`,
            backgroundSize: '50px 50px',
          }}
        />
        <div className="container-app relative py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} className="text-primary-400" />
              <span className="text-primary-400 text-sm font-medium">
                100,000+ Automotive Parts
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Find the Perfect Part for{' '}
              <span className="text-primary-400">Your Ride</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Trusted marketplace for car, bike, and superbike parts. Buy from verified
              sellers or list your own parts in minutes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary text-base px-8 py-3">
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link to="/signup" className="btn-outline border-white text-white hover:bg-white hover:text-gray-900 text-base px-8 py-3">
                Start Selling
              </Link>
            </div>
            {/* Stats */}
            <div className="flex gap-8 mt-10 text-center">
              {[
                { value: '50K+', label: 'Products' },
                { value: '12K+', label: 'Sellers' },
                { value: '98%', label: 'Satisfaction' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-primary-400">{s.value}</p>
                  <p className="text-sm text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      <section className="container-app py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Shop by Category</h2>
          <Link to="/products" className="text-primary-600 font-medium text-sm hover:underline flex items-center gap-1">
            View All <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {HERO_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              to={cat.to}
              className={`${cat.color} rounded-xl p-4 text-center hover:scale-105 transition-transform cursor-pointer`}
            >
              <div className="text-4xl mb-2">{cat.icon}</div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{cat.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────── */}
      <section className="container-app py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Featured Parts</h2>
          <Link to="/products?sort=popular" className="text-primary-600 font-medium text-sm hover:underline flex items-center gap-1">
            View All <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <Loader size="lg" className="py-16" />
        ) : featured.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No featured products yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {featured.slice(0, 8).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── Features / Trust Signals ─────────────────────────── */}
      <section className="bg-gray-50 dark:bg-dark-800 py-14 mt-8">
        <div className="container-app">
          <h2 className="section-title text-center mb-10">Why MotoParts?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6 text-center hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Sell Banner ──────────────────────────────────── */}
      <section className="container-app py-14">
        <div className="card bg-gradient-to-r from-primary-600 to-primary-800 border-none text-white p-10 text-center rounded-2xl">
          <h2 className="text-3xl font-bold mb-3">Have Parts to Sell?</h2>
          <p className="text-primary-100 mb-6 max-w-lg mx-auto">
            Join thousands of sellers on MotoParts. List your parts in minutes and reach
            buyers worldwide.
          </p>
          <Link to="/signup" className="inline-flex btn-primary bg-white text-primary-700 hover:bg-gray-100 px-8 py-3">
            Start Selling Today <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
