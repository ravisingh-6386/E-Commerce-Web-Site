import { createSlice } from '@reduxjs/toolkit';

const loadCart = () => {
  try {
    const saved = localStorage.getItem('motoparts_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveCart = (items) => {
  try {
    localStorage.setItem('motoparts_cart', JSON.stringify(items));
  } catch {}
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadCart(),
    isOpen: false,
  },
  reducers: {
    addToCart(state, action) {
      const product = action.payload;
      const existing = state.items.find((i) => i._id === product._id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + 1, product.stock || 99);
      } else {
        state.items.push({ ...product, quantity: 1 });
      }
      saveCart(state.items);
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((i) => i._id !== action.payload);
      saveCart(state.items);
    },
    updateQuantity(state, action) {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i._id === id);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i._id !== id);
        } else {
          item.quantity = quantity;
        }
      }
      saveCart(state.items);
    },
    clearCart(state) {
      state.items = [];
      saveCart([]);
    },
    toggleCart(state) {
      state.isOpen = !state.isOpen;
    },
    openCart(state) {
      state.isOpen = true;
    },
    closeCart(state) {
      state.isOpen = false;
    },
  },
});

// ── Selectors ────────────────────────────────────────────────
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartTotal = (state) =>
  state.cart.items.reduce(
    (sum, i) => sum + (i.discountedPrice ?? i.price) * i.quantity,
    0
  );

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
} = cartSlice.actions;

export default cartSlice.reducer;
