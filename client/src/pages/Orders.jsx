import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { Loader } from '../components/common/Loader';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/my-orders?page=${page}&limit=10`);
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container-app py-8 animate-fade-in">
      <h1 className="section-title mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={56} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Orders Yet</h2>
          <p className="text-gray-500 mb-6">Once you place an order, it will appear here.</p>
          <Link to="/products" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card p-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono font-medium">#{order._id.slice(-10).toUpperCase()}</p>
                </div>
                <div className="text-right sm:text-left">
                  <p className="text-sm text-gray-500">Placed</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'} capitalize`}>
                  {order.status}
                </span>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-bold text-primary-600">{formatCurrency(order.totalPrice)}</p>
                </div>
              </div>

              {/* Items preview */}
              <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
                {order.orderItems?.slice(0, 4).map((item, idx) => (
                  <img
                    key={idx}
                    src={item.image || item.product?.images?.[0]?.url || '/placeholder-product.svg'}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/placeholder-product.svg';
                    }}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-100 dark:border-dark-600"
                  />
                ))}
                {order.orderItems?.length > 4 && (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0 text-sm font-medium text-gray-500">
                    +{order.orderItems.length - 4}
                  </div>
                )}
              </div>

              <Link
                to={`/orders/${order._id}`}
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View Order Details <ChevronRight size={16} />
              </Link>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
