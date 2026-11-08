import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  size?: string;
  color?: string;
  variantId?: string;
}

// La identidad de una línea incluye su variante. Así un mismo producto puede
// estar en la bolsa con talla 4 y talla 10 sin que una acción afecte a la otra.
export const getCartItemKey = (item: Pick<CartItem, 'id' | 'variantId' | 'size' | 'color'>) =>
  [item.id, item.variantId || '', item.size || '', item.color || ''].join('::');

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => 
              item.id === newItem.id && 
              item.size === newItem.size && 
              item.color === newItem.color &&
              item.variantId === newItem.variantId
          );
          
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === newItem.id && 
                item.size === newItem.size && 
                item.color === newItem.color &&
                item.variantId === newItem.variantId
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              ),
            };
          }
          
          return { items: [...state.items, newItem] };
        });
      },
      removeItem: (lineKey) => {
        set((state) => ({
          items: state.items.filter((item) => getCartItemKey(item) !== lineKey),
        }));
      },
      updateQuantity: (lineKey, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            getCartItemKey(item) === lineKey ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'phalay-cart-storage',
    }
  )
);
