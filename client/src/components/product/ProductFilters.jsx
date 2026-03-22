import { useDispatch, useSelector } from 'react-redux';
import { setFilters, resetFilters } from '../../store/slices/productSlice';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Car Parts', value: 'car-parts' },
  { label: 'Bike Parts', value: 'bike-parts' },
  { label: 'Superbike Parts', value: 'superbike-parts' },
  { label: 'Engine Parts', value: 'engine-parts' },
  { label: 'Accessories', value: 'accessories' },
];

const VEHICLE_TYPES = [
  { label: 'All Types', value: '' },
  { label: 'Car', value: 'car' },
  { label: 'Bike', value: 'bike' },
  { label: 'Superbike', value: 'superbike' },
  { label: 'Universal', value: 'universal' },
];

const CONDITIONS = [
  { label: 'Any Condition', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Used', value: 'used' },
  { label: 'Refurbished', value: 'refurbished' },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Top Rated', value: 'rating' },
];

const POPULAR_BRANDS = [
  'Bosch', 'Denso', 'NGK', 'Brembo', 'Akrapovic',
  'Yoshimura', 'K&N', 'Bilstein', 'Monroe', 'Ferodo',
];

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 dark:border-dark-700 pb-4 mb-4">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
      >
        {title}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && children}
    </div>
  );
}

export default function ProductFilters({ onClose }) {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.products.filters);

  const update = (key, value) => dispatch(setFilters({ [key]: value }));

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Filters</h2>
        <button
          onClick={() => dispatch(resetFilters())}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
        >
          <RotateCcw size={13} /> Reset all
        </button>
      </div>

      {/* Sort */}
      <Section title="Sort By">
        <select
          value={filters.sort}
          onChange={(e) => update('sort', e.target.value)}
          className="input text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Section>

      {/* Category */}
      <Section title="Category">
        <div className="space-y-1.5">
          {CATEGORIES.map((c) => (
            <label key={c.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={c.value}
                checked={filters.category === c.value}
                onChange={() => update('category', c.value)}
                className="accent-primary-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{c.label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Vehicle Type */}
      <Section title="Vehicle Type">
        <div className="space-y-1.5">
          {VEHICLE_TYPES.map((v) => (
            <label key={v.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="vehicleType"
                value={v.value}
                checked={filters.vehicleType === v.value}
                onChange={() => update('vehicleType', v.value)}
                className="accent-primary-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{v.label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Condition */}
      <Section title="Condition">
        <div className="space-y-1.5">
          {CONDITIONS.map((c) => (
            <label key={c.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="condition"
                value={c.value}
                checked={filters.condition === c.value}
                onChange={() => update('condition', c.value)}
                className="accent-primary-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{c.label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Price Range */}
      <Section title="Price Range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            min="0"
            value={filters.minPrice}
            onChange={(e) => update('minPrice', e.target.value)}
            className="input text-sm"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            placeholder="Max"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => update('maxPrice', e.target.value)}
            className="input text-sm"
          />
        </div>
      </Section>

      {/* Brand */}
      <Section title="Brand" defaultOpen={false}>
        <input
          type="text"
          placeholder="Search brand…"
          value={filters.brand}
          onChange={(e) => update('brand', e.target.value)}
          className="input text-sm mb-2"
        />
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => update('brand', filters.brand === b ? '' : b)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                filters.brand === b
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:border-primary-400'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </Section>

      {onClose && (
        <button onClick={onClose} className="btn-primary w-full mt-2">
          Apply Filters
        </button>
      )}
    </aside>
  );
}
