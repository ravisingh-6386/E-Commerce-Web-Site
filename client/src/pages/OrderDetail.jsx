import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Truck, MapPin, CreditCard, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { Loader } from '../components/common/Loader';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.order);
      } catch {
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <Loader />;
  if (!order) return <div className="container-app py-20 text-center text-gray-500">Order not found.</div>;

  const statusIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="container-app py-8 animate-fade-in">
      {/* Back */}
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6">
        <ChevronLeft size={16} /> Back to Orders
      </Link>

      <div className="flex flex-wrap gap-4 items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Order #{order._id.slice(-10).toUpperCase()}</h1>
          <p className="text-gray-500 text-sm mt-1">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <span className={`badge text-sm ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'} capitalize`}>
          {order.status}
        </span>
      </div>

      {/* Status Tracker */}
      {!isCancelled && (
        <div className="card p-6 mb-6">
          <h2 className="font-bold mb-5">Order Progress</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute inset-y-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-dark-600 -z-0" />
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-2 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i <= statusIdx ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-dark-600 text-gray-400'
                }`}>
                  {i < statusIdx ? '✓' : i + 1}
                </div>
                <span className={`text-xs capitalize font-medium ${i <= statusIdx ? 'text-primary-600' : 'text-gray-400'}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Package size={18} /> Items Ordered</h2>
            <div className="space-y-4">
              {order.orderItems?.map((item, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <img
                    src={item.image || '/placeholder-product.svg'}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/placeholder-product.svg';
                    }}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2">{item.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-primary-600">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="card p-5">
            <h2 className="font-bold mb-3 flex items-center gap-2"><MapPin size={18} /> Shipping Address</h2>
            <address className="not-italic text-gray-600 dark:text-gray-400 text-sm space-y-0.5">
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
              <p>{order.shippingAddress?.country}</p>
            </address>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(order.itemsPrice ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shippingPrice === 0 ? <span className="text-green-600">FREE</span> : formatCurrency(order.shippingPrice ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatCurrency(order.taxPrice ?? 0)}</span></div>
              <div className="border-t dark:border-dark-600 pt-2 flex justify-between font-bold">
                <span>Total</span><span className="text-primary-600">{formatCurrency(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-bold mb-3 flex items-center gap-2"><CreditCard size={18} /> Payment</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={order.isPaid ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                  {order.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              {order.isPaid && order.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid on</span>
                  <span>{new Date(order.paidAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
