import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { formatCurrency } from '../utils/formatCurrency';
import { Loader } from '../components/common/Loader';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { data } = await api.get('/users/wishlist');
        setItems(data.wishlist || []);
      } catch {
        toast.error('Could not load wishlist');
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api.put('/users/wishlist', { productId });
      setItems((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({ ...product, quantity: 1 }));
    toast.success('Added to cart');
  };

  if (loading) return <Loader />;

  return (
    <div className="container-app py-8 animate-fade-in">
      <h1 className="section-title mb-8">My Wishlist ({items.length})</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={56} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Save products you love here to revisit them later.</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((product) => {
            const price = product.discountedPrice ?? product.price;
            return (
              <div key={product._id} className="card overflow-hidden group">
                <Link to={`/products/${product._id}`} className="block relative overflow-hidden aspect-square">
                  <img
                    src={product.images?.[0]?.url || '/placeholder-product.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm bg-gray-900 px-3 py-1 rounded-full">Out of Stock</span>
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product._id}`} className="font-medium hover:text-primary-600 line-clamp-2 text-sm">
                    {product.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-1">{product.brand}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-primary-600">{formatCurrency(price)}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition-colors"
                        title="Add to cart"
                      >
                        <ShoppingCart size={15} />
                      </button>
                      <button
                        onClick={() => handleRemove(product._id)}
                        className="p-2 text-gray-400 hover:text-red-500 border border-gray-200 dark:border-dark-600 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
