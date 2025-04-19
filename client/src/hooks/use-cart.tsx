import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  name: string;
  price: string;
  imageUrl: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: string;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (item: CartItem) => {
        set((state) => {
          const existingItem = state.items.find(i => i.productId === item.productId);
          
          if (existingItem) {
            return {
              items: state.items.map(i => 
                i.productId === item.productId 
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              )
            };
          }
          
          return { items: [...state.items, item] };
        });
      },

      removeFromCart: (productId: number) => {
        set((state) => ({
          items: state.items.filter(i => i.productId !== productId)
        }));
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        
        set((state) => ({
          items: state.items.map(i => 
            i.productId === productId ? { ...i, quantity } : i
          )
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      get totalItems() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get totalPrice() {
        const total = get().items.reduce(
          (sum, item) => sum + (parseFloat(item.price) * item.quantity), 
          0
        );
        return total.toFixed(2);
      }
    }),
    {
      name: 'nursing-rocks-cart',
    }
  )
);