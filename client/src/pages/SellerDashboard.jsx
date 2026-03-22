import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, Plus, Pencil, Trash2, ChevronRight, BarChart2,
  TrendingUp, DollarSign, ShoppingCart, Eye, EyeOff,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { Loader } from '../components/common/Loader';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const TABS = ['Overview', 'My Products', 'Orders'];

export default function SellerDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [tab, setTab] = useState('Overview');

  // Products state
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (tab === 'My Products' && products.length === 0) fetchProducts();
    if (tab === 'Orders' && orders.length === 0) fetchOrders();
    if (tab === 'Overview' && !stats) fetchStats();
  }, [tab]);

  const fetchProducts = async () => {
    setProdLoading(true);
    try {
      const { data } = await api.get('/products/my-products');
      setProducts(data.products || []);
    } catch { toast.error('Failed to load products'); }
    finally { setProdLoading(false); }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data } = await api.get('/orders/seller');
      setOrders(data.orders || []);
    } catch { toast.error('Failed to load orders'); }
    finally { setOrdersLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/orders/seller/stats');
      setStats(data);
    } catch { /* stats optional */ }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((p) => p.filter((x) => x._id !== id));
      toast.success('Product deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleToggleFeatured = async (product) => {
    try {
      const { data } = await api.put(`/products/${product._id}`, { isFeatured: !product.isFeatured });
      setProducts((p) => p.map((x) => x._id === product._id ? { ...x, isFeatured: !x.isFeatured } : x));
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="container-app py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Seller Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.businessName || user?.name}!</p>
        </div>
        <Link to="/seller/products/new" className="btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-dark-700 mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Sales', value: stats ? formatCurrency(stats.totalRevenue || 0) : '—', icon: DollarSign, color: 'text-green-600 bg-green-100' },
              { label: 'Total Orders', value: stats?.totalOrders ?? '—', icon: ShoppingCart, color: 'text-blue-600 bg-blue-100' },
              { label: 'Products Listed', value: stats?.totalProducts ?? products.length, icon: Package, color: 'text-purple-600 bg-purple-100' },
              { label: 'Avg. Rating', value: stats?.avgRating ? `${stats.avgRating.toFixed(1)} ★` : '—', icon: TrendingUp, color: 'text-amber-600 bg-amber-100' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${color}`}><Icon size={22} /></div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-6 text-center text-gray-500">
            <BarChart2 size={48} className="mx-auto mb-3 opacity-30" />
            <p>Detailed analytics charts coming soon.</p>
          </div>
        </div>
      )}

      {/* My Products */}
      {tab === 'My Products' && (
        <div>
          {prodLoading ? <Loader /> : products.length === 0 ? (
            <div className="text-center py-16">
              <Package size={56} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">You haven't listed any products yet.</p>
              <Link to="/seller/products/new" className="btn-primary">List Your First Product</Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    {['Product', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.images?.[0]?.url || '/placeholder-product.svg'} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="min-w-0">
                            <p className="font-medium line-clamp-1">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(p.discountedPrice ?? p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={p.stock > 0 ? 'text-green-600' : 'text-red-500'}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link to={`/seller/products/edit/${p._id}`} className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors">
                            <Pencil size={15} />
                          </Link>
                          <button onClick={() => handleDeleteProduct(p._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Orders */}
      {tab === 'Orders' && (
        <div>
          {ordersLoading ? <Loader /> : orders.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <ShoppingCart size={56} className="mx-auto mb-4 opacity-30" />
              <p>No orders yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    {['Order ID', 'Buyer', 'Items', 'Total', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                      <td className="px-4 py-3 font-mono text-xs">#{o._id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3">{o.buyer?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{o.orderItems?.length || 0}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(o.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/orders/${o._id}`} className="text-primary-600 hover:underline flex items-center gap-1">
                          View <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
