import { useEffect, useState } from 'react';
import {
  Users, Package, ShoppingCart, DollarSign,
  CheckCircle, XCircle, Shield, ToggleLeft, ToggleRight,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { Loader } from '../components/common/Loader';
import toast from 'react-hot-toast';

const TABS = ['Stats', 'Users', 'Sellers', 'Products', 'Orders'];

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminPanel() {
  const [tab, setTab] = useState('Stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'Stats') loadStats();
    if (tab === 'Users') loadUsers();
    if (tab === 'Sellers') loadPendingSellers();
    if (tab === 'Products') loadProducts();
    if (tab === 'Orders') loadOrders();
  }, [tab]);

  const load = (fn, setter) => async () => {
    setLoading(true);
    try { const { data } = await fn(); setter(data); }
    catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const loadStats = load(() => api.get('/admin/stats'), setStats);
  const loadUsers = load(() => api.get('/admin/users'), (d) => setUsers(d.users || []));
  const loadPendingSellers = load(() => api.get('/admin/sellers/pending'), (d) => setPendingSellers(d.sellers || []));
  const loadProducts = load(() => api.get('/admin/products'), (d) => setProducts(d.products || []));
  const loadOrders = load(() => api.get('/admin/orders'), (d) => setOrders(d.orders || []));

  const handleSellerAction = async (userId, action) => {
    try {
      await api.patch(`/admin/sellers/${userId}`, { action });
      setPendingSellers((p) => p.filter((s) => s._id !== userId));
      toast.success(`Seller ${action === 'approve' ? 'approved' : 'rejected'}`);
    } catch { toast.error('Action failed'); }
  };

  const handleToggleUser = async (userId) => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/toggle`);
      setUsers((u) => u.map((x) => x._id === userId ? { ...x, isActive: data.isActive } : x));
    } catch { toast.error('Failed to toggle user'); }
  };

  const handleToggleProduct = async (productId) => {
    try {
      const { data } = await api.patch(`/admin/products/${productId}/approve`);
      setProducts((p) => p.map((x) => x._id === productId ? { ...x, isApproved: data.isApproved } : x));
    } catch { toast.error('Failed to update product'); }
  };

  return (
    <div className="container-app py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={28} className="text-primary-600" />
        <h1 className="section-title">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-dark-700 mb-8 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <Loader />}

      {/* Stats */}
      {tab === 'Stats' && !loading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue || 0), icon: DollarSign, color: 'text-green-600 bg-green-100' },
            { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, color: 'text-blue-600 bg-blue-100' },
            { label: 'Total Orders', value: stats.totalOrders ?? 0, icon: ShoppingCart, color: 'text-purple-600 bg-purple-100' },
            { label: 'Total Products', value: stats.totalProducts ?? 0, icon: Package, color: 'text-amber-600 bg-amber-100' },
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
      )}

      {/* Users */}
      {tab === 'Users' && !loading && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>{['Name', 'Email', 'Role', 'Joined', 'Status', 'Action'].map((h) => <th key={h} className="text-left px-4 py-3 font-medium text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 capitalize">
                    <span className={`badge text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'seller' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive !== false ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleUser(u._id)} className="text-gray-400 hover:text-primary-600 transition-colors">
                      {u.isActive !== false ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Sellers */}
      {tab === 'Sellers' && !loading && (
        <div>
          {pendingSellers.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No pending seller applications.</div>
          ) : (
            <div className="space-y-4">
              {pendingSellers.map((seller) => (
                <div key={seller._id} className="card p-5 flex items-center gap-4">
                  <img src={seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=dc2626&color=fff`} alt={seller.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{seller.name}</p>
                    <p className="text-sm text-gray-500">{seller.email}</p>
                    {seller.businessName && <p className="text-sm font-medium mt-0.5">{seller.businessName}</p>}
                    {seller.sellerBio && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{seller.sellerBio}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleSellerAction(seller._id, 'approve')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                      <CheckCircle size={15} /> Approve
                    </button>
                    <button onClick={() => handleSellerAction(seller._id, 'reject')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products */}
      {tab === 'Products' && !loading && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>{['Product', 'Seller', 'Price', 'Category', 'Approved', 'Toggle'].map((h) => <th key={h} className="text-left px-4 py-3 font-medium text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={p.images?.[0]?.url || '/placeholder-product.svg'} className="w-9 h-9 rounded-lg object-cover" alt={p.name} />
                      <span className="line-clamp-1 max-w-[180px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.seller?.name || '—'}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(p.discountedPrice ?? p.price)}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">{p.category}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.isApproved ? 'Yes' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleProduct(p._id)} className="text-gray-400 hover:text-primary-600 transition-colors">
                      {p.isApproved ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders */}
      {tab === 'Orders' && !loading && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>{['Order ID', 'Buyer', 'Total', 'Payment', 'Status', 'Date'].map((h) => <th key={h} className="text-left px-4 py-3 font-medium text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40">
                  <td className="px-4 py-3 font-mono text-xs">#{o._id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3">{o.buyer?.name || '—'}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(o.totalPrice)}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
