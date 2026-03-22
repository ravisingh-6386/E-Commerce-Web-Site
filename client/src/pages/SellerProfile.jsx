import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Star, Package } from 'lucide-react';
import api from '../services/api';
import { useSelector } from 'react-redux';
import ProductCard from '../components/product/ProductCard';
import { Loader } from '../components/common/Loader';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

export default function SellerProfile() {
  const { id } = useParams();
  const { user } = useSelector((s) => s.auth);
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sellerRes, productsRes] = await Promise.all([
          api.get(`/users/${id}/public`),
          api.get(`/products?seller=${id}&limit=12`),
        ]);
        setSeller(sellerRes.data.user);
        setProducts(productsRes.data.products || []);
      } catch {
        toast.error('Failed to load seller profile');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <Loader />;
  if (!seller) return <div className="container-app py-20 text-center text-gray-500">Seller not found.</div>;

  const avatarUrl = seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=dc2626&color=fff`;

  return (
    <div className="container-app py-8 animate-fade-in">
      {/* Seller Header */}
      <div className="card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
        <img src={avatarUrl} alt={seller.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-100 flex-shrink-0" />
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold">{seller.businessName || seller.name}</h1>
          {seller.sellerBio && <p className="text-gray-500 mt-1 max-w-xl">{seller.sellerBio}</p>}

          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Package size={16} className="text-primary-500" />
              <span>{products.length} Products Listed</span>
            </div>
            {seller.totalSales !== undefined && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Star size={16} className="text-amber-500" />
                <span>{seller.totalSales} Sales</span>
              </div>
            )}
          </div>
        </div>

        {/* Message seller (only if logged in and not their own profile) */}
        {user && user._id !== id && (
          <Link to={`/messages/${id}`} className="btn-primary flex-shrink-0">
            <MessageCircle size={16} /> Message Seller
          </Link>
        )}
      </div>

      {/* Seller's Products */}
      <h2 className="text-xl font-bold mb-5">Products by {seller.businessName || seller.name}</h2>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>No products listed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
