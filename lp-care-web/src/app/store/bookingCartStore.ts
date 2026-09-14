import { create } from "zustand"
import type { Address, CollectionMethod, PathologyTest, TestPackage } from "@/types"

interface BookingCartState {
  selectedTests: PathologyTest[]
  selectedPackage: TestPackage | null
  forFamilyMemberId: string | null
  collectionMethod: CollectionMethod | null
  selectedAddress: Address | null
  collectionDate: string | null
  collectionSlot: string | null
  couponCode: string | null

  addTest: (test: PathologyTest) => void
  removeTest: (testId: string) => void
  selectPackage: (pkg: TestPackage | null) => void
  setForFamilyMember: (id: string | null) => void
  setCollectionMethod: (method: CollectionMethod) => void
  setAddress: (address: Address | null) => void
  setCollectionSlot: (date: string, slot: string) => void
  setCoupon: (code: string | null) => void
  reset: () => void
}

const initialState = {
  selectedTests: [] as PathologyTest[],
  selectedPackage: null as TestPackage | null,
  forFamilyMemberId: null as string | null,
  collectionMethod: null as CollectionMethod | null,
  selectedAddress: null as Address | null,
  collectionDate: null as string | null,
  collectionSlot: null as string | null,
  couponCode: null as string | null,
}

export const useBookingCartStore = create<BookingCartState>()((set) => ({
  ...initialState,
  addTest: (test) =>
    set((state) =>
      state.selectedTests.some((t) => t.id === test.id)
        ? state
        : { selectedTests: [...state.selectedTests, test], selectedPackage: null },
    ),
  removeTest: (testId) => set((state) => ({ selectedTests: state.selectedTests.filter((t) => t.id !== testId) })),
  selectPackage: (pkg) => set({ selectedPackage: pkg, selectedTests: [] }),
  setForFamilyMember: (id) => set({ forFamilyMemberId: id }),
  setCollectionMethod: (method) => set({ collectionMethod: method }),
  setAddress: (address) => set({ selectedAddress: address }),
  setCollectionSlot: (date, slot) => set({ collectionDate: date, collectionSlot: slot }),
  setCoupon: (code) => set({ couponCode: code }),
  reset: () => set(initialState),
}))
