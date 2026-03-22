import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, LayoutGrid, List, X } from 'lucide-react';
import { fetchProducts, setFilters } from '../store/slices/productSlice';
import ProductCard from '../components/product/ProductCard';
import ProductFilters from '../components/product/ProductFilters';
import { PageLoader } from '../components/common/Loader';

export default function Products() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { items, loading, error, page, pages, total, filters } = useSelector((s) => s.products);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Sync URL params → filters
  useEffect(() => {
    const params = {};
    ['search', 'category', 'vehicleType', 'brand', 'condition'].forEach((key) => {
      const v = searchParams.get(key);
      if (v) params[key] = v;
    });
    if (Object.keys(params).length > 0) dispatch(setFilters(params));
  }, [searchParams, dispatch]);

  // Fetch when filters change
  useEffect(() => {
    const params = { ...filters, page };
    // Remove empty values
    Object.keys(params).forEach((k) => {
      if (!params[k]) delete params[k];
    });
    dispatch(fetchProducts(params));
  }, [filters, dispatch]);

  const handlePageChange = (newPage) => {
    const params = { ...filters, page: newPage };
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    dispatch(fetchProducts(params));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container-app py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">
            {filters.category
              ? filters.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
              : 'All Parts'}
          </h1>
          {!loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {total.toLocaleString()} results found
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'}`}
          >
            <List size={18} />
          </button>
          {/* Mobile filter button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 btn-secondary text-sm lg:hidden"
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Filters Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <div className="card p-5 sticky top-4">
            <ProductFilters />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <PageLoader />
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="font-bold text-xl mb-2">No parts found</h3>
              <p className="text-gray-500">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5'
                    : 'space-y-4'
                }
              >
                {items.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                    let pageNum;
                    if (pages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= pages - 3) {
                      pageNum = pages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          pageNum === page
                            ? 'bg-primary-600 text-white'
                            : 'btn-secondary'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pages}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-900 rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Filters</h2>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <ProductFilters onClose={() => setMobileFilterOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
