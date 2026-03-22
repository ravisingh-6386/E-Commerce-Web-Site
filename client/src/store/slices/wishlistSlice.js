import { createSlice } from '@reduxjs/toolkit';

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
  },
  reducers: {
    setWishlist(state, action) {
      state.items = action.payload;
    },
    toggleWishlistItem(state, action) {
      const id = action.payload;
      const idx = state.items.indexOf(id);
      if (idx === -1) {
        state.items.push(id);
      } else {
        state.items.splice(idx, 1);
      }
    },
  },
});

export const selectIsWishlisted = (productId) => (state) =>
  state.wishlist.items.includes(productId);

export const { setWishlist, toggleWishlistItem } = wishlistSlice.actions;
export default wishlistSlice.reducer;
