import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

import { addToCart, openCart } from '../../store/slices/cartSlice';
import { toggleWishlistItem, selectIsWishlisted } from '../../store/slices/wishlistSlice';
import { formatCurrency, discountPercent } from '../../utils/formatCurrency';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const isWishlisted = useSelector(selectIsWishlisted(product._id));

  const displayPrice = product.discountedPrice ?? product.price;
  const discount = discountPercent(product.price, product.discountedPrice);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product.stock === 0) {
      toast.error('Out of stock');
      return;
    }
    dispatch(addToCart(product));
    dispatch(openCart());
    toast.success('Added to cart');
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Sign in to save items');
      return;
    }
    try {
      await api.put(`/users/wishlist/${product._id}`);
      dispatch(toggleWishlistItem(product._id));
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch {
      toast.error('Something went wrong');
    }
  };

  const conditionColor = {
    new: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    used: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    refurbished: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <Link to={`/products/${product._id}`} className="group card hover:shadow-md transition-shadow overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 dark:bg-dark-700 overflow-hidden">
        <img
          src={product.images?.[0]?.url || '/placeholder-product.svg'}
          alt={product.name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder-product.svg';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <span className="badge bg-primary-600 text-white">{discount}% OFF</span>
          )}
          {product.isFeatured && (
            <span className="badge bg-amber-500 text-white">Featured</span>
          )}
        </div>

        {/* Condition badge */}
        <span className={`absolute top-2 right-2 badge ${conditionColor[product.condition]}`}>
          {product.condition}
        </span>

        {/* Hover actions */}
        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
          <button
            onClick={handleWishlist}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
              isWishlisted
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-300 hover:bg-primary-50'
            }`}
            aria-label="Add to wishlist"
          >
            <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{product.brand}</p>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.numReviews > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {product.ratings.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">({product.numReviews})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-primary-600">
            {formatCurrency(displayPrice)}
          </span>
          {discount > 0 && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="btn-primary w-full text-sm py-2"
        >
          <ShoppingCart size={15} />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
