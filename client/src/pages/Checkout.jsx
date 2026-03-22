import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Truck, ChevronRight } from 'lucide-react';
import { selectCartItems, selectCartTotal } from '../store/slices/cartSlice';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

const TAX_RATE = 0.08;
const SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 9.99;

const STEPS = ['Shipping', 'Payment', 'Review'];

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartTotal);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const total = subtotal + shipping + tax;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || '',
  });

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setStep(1);
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const payload = {
        orderItems: items.map((item) => ({
          product: item._id,
          quantity: item.quantity,
          price: item.discountedPrice ?? item.price,
        })),
        shippingAddress: address,
        paymentMethod,
      };
      const { data } = await api.post('/orders', payload);
      if (paymentMethod === 'stripe' && data.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.sessionUrl;
      } else {
        toast.success('Order placed successfully!');
        navigate('/orders');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-app py-8 animate-fade-in">
      <h1 className="section-title mb-8">Checkout</h1>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-10 gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              i === step ? 'bg-primary-600 text-white' : i < step ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-dark-700 text-gray-400'
            }`}>
              {i < step ? <CheckCircle size={16} /> : <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-current text-xs">{i + 1}</span>}
              {s}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={18} className="text-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Steps */}
        <div className="lg:col-span-2">
          {/* Step 0: Shipping */}
          {step === 0 && (
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-5 flex items-center gap-2"><Truck size={20} /> Shipping Address</h2>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Street Address</label>
                  <input className="input" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">City</label>
                    <input className="input" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">State</label>
                    <input className="input" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">ZIP Code</label>
                    <input className="input" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Country</label>
                    <input className="input" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} required />
                  </div>
                </div>
                <button type="submit" className="btn-primary">Continue to Payment</button>
              </form>
            </div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-5 flex items-center gap-2"><CreditCard size={20} /> Payment Method</h2>
              <div className="space-y-3 mb-6">
                {[
                  { value: 'stripe', label: 'Credit / Debit Card', sub: 'Secure payment via Stripe', icon: '💳' },
                  { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when you receive your order', icon: '💵' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'
                    }`}
                  >
                    <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-primary-600" />
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-sm text-gray-500">{opt.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary">Back</button>
                <button onClick={() => setStep(2)} className="btn-primary">Review Order</button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-5">Review Your Order</h2>

              {/* Items */}
              <div className="space-y-3 mb-5">
                {items.map((item) => {
                  const price = item.discountedPrice ?? item.price;
                  return (
                    <div key={item._id} className="flex gap-3 items-center">
                      <img src={item.images?.[0]?.url || '/placeholder-product.svg'} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-sm">{formatCurrency(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Shipping address summary */}
              <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4 text-sm mb-5">
                <p className="font-medium mb-1">Shipping to:</p>
                <p className="text-gray-500">{address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}</p>
                <p className="font-medium mt-2">Payment: <span className="text-gray-500">{paymentMethod === 'stripe' ? 'Credit/Debit Card' : 'Cash on Delivery'}</span></p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                <button onClick={handlePlaceOrder} disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : paymentMethod === 'stripe' ? (
                    'Pay with Stripe'
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div>
          <div className="card p-5 sticky top-4">
            <h3 className="font-bold mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{shipping === 0 ? <span className="text-green-600">FREE</span> : formatCurrency(shipping)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax (8%)</span><span>{formatCurrency(tax)}</span></div>
              <div className="border-t dark:border-dark-600 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(total)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">🔒 Secure & encrypted checkout</p>
          </div>
        </div>
      </div>
    </div>
  );
}
