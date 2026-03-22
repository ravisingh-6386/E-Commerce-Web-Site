import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import {
  removeFromCart,
  updateQuantity,
  clearCart,
  selectCartItems,
  selectCartTotal,
} from '../store/slices/cartSlice';
import { formatCurrency } from '../utils/formatCurrency';

const TAX_RATE = 0.08;
const SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 9.99;

export default function Cart() {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartTotal);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="container-app py-20 text-center animate-fade-in">
        <ShoppingBag size={64} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-6">Browse our parts and add something to your cart.</p>
        <Link to="/products" className="btn-primary">
          Start Shopping <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title">Shopping Cart ({items.length})</h1>
        <button
          onClick={() => dispatch(clearCart())}
          className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
        >
          <Trash2 size={15} /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = item.discountedPrice ?? item.price;
            return (
              <div key={item._id} className="card p-4 flex gap-4">
                <Link to={`/products/${item._id}`}>
                  <img
                    src={item.images?.[0]?.url || '/placeholder-product.svg'}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item._id}`}
                    className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-gray-400 mt-0.5">{item.brand}</p>
                  <p className="text-sm text-gray-500 mt-0.5 capitalize">{item.condition}</p>

                  <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                    {/* Qty */}
                    <div className="flex items-center border border-gray-200 dark:border-dark-600 rounded-lg overflow-hidden">
                      <button
                        onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}
                        className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-4 font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}
                        disabled={item.quantity >= (item.stock || 99)}
                        className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary-600">
                        {formatCurrency(price * item.quantity)}
                      </span>
                      <button
                        onClick={() => dispatch(removeFromCart(item._id))}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div>
          <div className="card p-6 sticky top-4">
            <h2 className="font-bold text-lg mb-5">Order Summary</h2>
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-medium">FREE</span>
                  ) : (
                    formatCurrency(shipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (8%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-dark-700 pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(total)}</span>
              </div>
            </div>

            {subtotal < SHIPPING_THRESHOLD && (
              <p className="text-xs text-center text-gray-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-2 rounded-lg mb-4">
                Add {formatCurrency(SHIPPING_THRESHOLD - subtotal)} more for FREE shipping!
              </p>
            )}

            <Link to="/checkout" className="btn-primary w-full justify-center block text-center mb-3">
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/products" className="btn-secondary w-full text-center block text-sm">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
