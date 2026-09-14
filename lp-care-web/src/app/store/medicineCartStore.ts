import { create } from "zustand"
import type { Product } from "@/types"

export interface MedicineCartLine {
  product: Product
  quantity: number
}

interface MedicineCartState {
  items: MedicineCartLine[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  reset: () => void
}

export const useMedicineCartStore = create<MedicineCartState>()((set) => ({
  items: [],
  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id)
      if (existing) {
        return {
          items: state.items.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)),
        }
      }
      return { items: [...state.items, { product, quantity: 1 }] }
    }),
  removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),
  setQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.product.id !== productId)
          : state.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    })),
  reset: () => set({ items: [] }),
}))
