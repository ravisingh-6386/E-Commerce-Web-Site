import { useDispatch, useSelector } from 'react-redux';
import { X, ShoppingBag, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  closeCart,
  removeFromCart,
  updateQuantity,
  selectCartItems,
  selectCartTotal,
} from '../../store/slices/cartSlice';
import { formatCurrency } from '../../utils/formatCurrency';

export default function CartSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const isOpen = useSelector((s) => s.cart.isOpen);

  const handleCheckout = () => {
    dispatch(closeCart());
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => dispatch(closeCart())}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-dark-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary-600" />
            <h2 className="font-bold text-lg">Cart ({items.length})</h2>
          </div>
          <button
            onClick={() => dispatch(closeCart())}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">Browse parts and add them here</p>
              <Link to="/products" onClick={() => dispatch(closeCart())} className="btn-primary text-sm">
                Shop Now
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const price = item.discountedPrice ?? item.price;
              return (
                <div key={item._id} className="flex gap-3 p-3 card">
                  <img
                    src={item.images?.[0]?.url || '/placeholder-product.svg'}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item._id}`}
                      onClick={() => dispatch(closeCart())}
                      className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 hover:text-primary-600"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">{item.brand}</p>
                    <div className="flex items-center justify-between mt-2">
                      {/* Qty controls */}
                      <div className="flex items-center gap-1 border border-gray-200 dark:border-dark-600 rounded-lg overflow-hidden">
                        <button
                          onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-2 text-sm font-medium min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}
                          disabled={item.quantity >= (item.stock || 99)}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors disabled:opacity-40"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <span className="font-bold text-primary-600 text-sm">
                        {formatCurrency(price * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch(removeFromCart(item._id))}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 dark:border-dark-700 px-5 py-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary-600 text-lg">{formatCurrency(total)}</span>
            </div>
            <button onClick={handleCheckout} className="btn-primary w-full">
              Proceed to Checkout
            </button>
            <Link
              to="/cart"
              onClick={() => dispatch(closeCart())}
              className="btn-secondary w-full text-center block text-sm"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
