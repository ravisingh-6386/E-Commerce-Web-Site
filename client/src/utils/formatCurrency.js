/**
 * Format a number as Indian Rupee currency string.
 * e.g. 1234.5  →  "₹1,234.5"
 */
export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(amount)) ? Number(amount) : 0);

/**
 * Calculate the discount percentage.
 */
export const discountPercent = (original, discounted) => {
  if (!original || !discounted || discounted >= original) return 0;
  return Math.round(((original - discounted) / original) * 100);
};
