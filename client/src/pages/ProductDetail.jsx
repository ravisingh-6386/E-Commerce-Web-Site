import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShoppingCart, Heart, Star, Share2, MessageSquare,
  ChevronLeft, ChevronRight, ShieldCheck, Truck, Package,
  Wrench, CheckCircle2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { fetchProduct, clearCurrent } from '../store/slices/productSlice';
import { addToCart, openCart } from '../store/slices/cartSlice';
import { toggleWishlistItem, selectIsWishlisted } from '../store/slices/wishlistSlice';
import { formatCurrency, discountPercent } from '../utils/formatCurrency';
import { PageLoader } from '../components/common/Loader';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { current: product, loading, error } = useSelector((s) => s.products);
  const isWishlisted = useSelector(selectIsWishlisted(id));

  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProduct(id));
    loadReviews();
    return () => dispatch(clearCurrent());
  }, [id, dispatch]);

  const loadReviews = async () => {
    try {
      const res = await api.get(`/reviews/${id}`);
      setReviews(res.data.reviews);
    } catch {}
  };

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    for (let i = 0; i < quantity; i++) dispatch(addToCart(product));
    dispatch(openCart());
    toast.success(`${quantity} item(s) added to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Sign in to save items'); return; }
    try {
      await api.put(`/users/wishlist/${id}`);
      dispatch(toggleWishlistItem(id));
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch { toast.error('Something went wrong'); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Sign in to leave a review'); return; }
    setReviewLoading(true);
    try {
      await api.post(`/reviews/${id}`, reviewForm);
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, title: '', comment: '' });
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error || !product) return (
    <div className="container-app py-20 text-center">
      <p className="text-5xl mb-4">🔍</p>
      <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
      <Link to="/products" className="btn-primary mt-4 inline-flex">Back to Products</Link>
    </div>
  );

  const price = product.discountedPrice ?? product.price;
  const discount = discountPercent(product.price, product.discountedPrice);

  return (
    <div className="container-app py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-primary-600 capitalize">
          {product.category.replace(/-/g, ' ')}
        </Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* ── Image Gallery ── */}
        <div>
          {/* Main image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-dark-800 mb-3">
            <img
              src={product.images?.[currentImageIdx]?.url || '/placeholder-product.svg'}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/placeholder-product.svg';
              }}
              className="w-full h-full object-cover"
            />
            {product.images?.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIdx((p) => (p - 1 + product.images.length) % product.images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 dark:bg-dark-800/80 rounded-full flex items-center justify-center shadow hover:bg-white"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentImageIdx((p) => (p + 1) % product.images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 dark:bg-dark-800/80 rounded-full flex items-center justify-center shadow hover:bg-white"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
            {discount > 0 && (
              <span className="absolute top-3 left-3 badge bg-primary-600 text-white text-sm">
                {discount}% OFF
              </span>
            )}
          </div>
          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIdx(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    idx === currentImageIdx ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/placeholder-product.svg';
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h1>
            <button
              onClick={handleWishlist}
              className={`p-2.5 rounded-xl border-2 flex-shrink-0 transition-colors ${
                isWishlisted
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                  : 'border-gray-200 dark:border-dark-600 text-gray-400 hover:border-primary-400'
              }`}
            >
              <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          <p className="text-gray-500 dark:text-gray-400 mb-3">{product.brand}</p>

          {/* Rating */}
          {product.numReviews > 0 && (
            <div className="flex items-center gap-1.5 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  className={s <= Math.round(product.ratings) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                />
              ))}
              <span className="text-sm font-medium">{product.ratings.toFixed(1)}</span>
              <span className="text-sm text-gray-400">({product.numReviews} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-3xl font-extrabold text-primary-600">
              {formatCurrency(price)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {formatCurrency(product.price)}
                </span>
                <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm">
                  Save {formatCurrency(product.price - product.discountedPrice)}
                </span>
              </>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span className={`badge text-sm ${product.condition === 'new' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : product.condition === 'used' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
              {product.condition}
            </span>
            <span className="badge bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 text-sm capitalize">
              {product.vehicleType}
            </span>
            <span className="badge bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 text-sm">
              {product.stock > 0 ? (
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> In Stock ({product.stock})</span>
              ) : (
                <span className="flex items-center gap-1"><AlertCircle size={12} className="text-red-500" /> Out of Stock</span>
              )}
            </span>
          </div>

          {/* Compatible vehicles */}
          {product.compatibleVehicles?.length > 0 && (
            <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                <Wrench size={15} /> Compatible Vehicles
              </p>
              <div className="flex flex-wrap gap-1.5">
                {product.compatibleVehicles.map((v, i) => (
                  <span key={i} className="badge bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300 text-xs">
                    {v.make} {v.model} {v.yearFrom && `(${v.yearFrom}${v.yearTo ? `–${v.yearTo}` : '+'})`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-gray-300 dark:border-dark-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-lg"
                >−</button>
                <span className="px-5 py-2.5 font-semibold min-w-[40px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-lg"
                >+</button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary flex-1">
                <ShoppingCart size={18} /> Add to Cart
              </button>
            </div>
          )}
          <button
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            className="btn-outline w-full mb-5 disabled:opacity-50"
          >
            Buy Now
          </button>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3 mb-5 text-center">
            {[
              { icon: <ShieldCheck size={20} />, label: 'Secure Payment' },
              { icon: <Truck size={20} />, label: `Ships in ${product.shippingDays || 5} days` },
              { icon: <Package size={20} />, label: 'Easy Returns' },
            ].map((f) => (
              <div key={f.label} className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
                <div className="flex justify-center mb-1 text-primary-600">{f.icon}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{f.label}</p>
              </div>
            ))}
          </div>

          {/* Seller info */}
          {product.seller && (
            <Link
              to={`/seller/${product.seller._id}`}
              className="flex items-center gap-3 p-4 card hover:shadow-md transition-shadow"
            >
              <img
                src={product.seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.seller.name)}&background=ef4444&color=fff`}
                alt={product.seller.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">{product.seller.businessName || product.seller.name}</p>
                <p className="text-xs text-gray-400">View seller profile</p>
              </div>
              <Link
                to={`/messages/${product.seller._id}`}
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-1.5 px-3 py-1.5 btn-secondary text-xs"
              >
                <MessageSquare size={14} /> Message
              </Link>
            </Link>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="card p-6 mb-8">
        <h2 className="font-bold text-lg mb-4">Description</h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{product.description}</p>
        {product.partNumber && (
          <p className="mt-3 text-sm text-gray-500">Part Number: <span className="font-mono font-medium">{product.partNumber}</span></p>
        )}
      </div>

      {/* Reviews */}
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-6">Reviews ({reviews.length})</h2>

        {/* Review form */}
        {user && (
          <form onSubmit={handleReviewSubmit} className="mb-8 p-5 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <h3 className="font-semibold mb-4">Write a Review</h3>
            <div className="mb-3">
              <label className="label">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                  >
                    <Star
                      size={28}
                      className={s <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="label">Title</label>
              <input
                className="input"
                value={reviewForm.title}
                onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                required
                placeholder="Summarize your experience"
              />
            </div>
            <div className="mb-4">
              <label className="label">Review</label>
              <textarea
                className="input resize-none"
                rows={4}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                required
                placeholder="Share details about the product"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={reviewLoading}>
              {reviewLoading ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-5">
            {reviews.map((r) => (
              <div key={r._id} className="pb-5 border-b border-gray-100 dark:border-dark-700 last:border-0">
                <div className="flex items-start gap-3">
                  <img
                    src={r.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user?.name || 'U')}&background=ef4444&color=fff`}
                    alt={r.user?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{r.user?.name}</p>
                      {r.isVerifiedPurchase && (
                        <span className="badge bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs">
                          <CheckCircle2 size={10} className="mr-1" /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 my-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={13} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                      ))}
                    </div>
                    <p className="font-medium text-sm mb-1">{r.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{r.comment}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
