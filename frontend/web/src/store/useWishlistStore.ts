import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  slug: string;
  title: string;
  price: string;
  img: string;
}

interface WishlistStore {
  items: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  clearWishlist: () => void;
  isInWishlist: (slug: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleWishlist: (newItem) => {
        set((state) => {
          const exists = state.items.some((item) => item.slug === newItem.slug);
          if (exists) {
            return { items: state.items.filter((item) => item.slug !== newItem.slug) };
          }
          return { items: [...state.items, newItem] };
        });
      },
      clearWishlist: () => set({ items: [] }),
      isInWishlist: (slug) => {
        return get().items.some((item) => item.slug === slug);
      },
    }),
    {
      name: 'phalay-wishlist-storage',
    }
  )
);
