import { create } from "zustand";
import { Slot, VenueCategory } from "@/types/venue";

interface BookingStoreState {
  // Discovery & Search state
  selectedCity: string;
  selectedCategory: VenueCategory;
  searchQuery: string;
  isSearchModalOpen: boolean;
  
  // Authentication Gateway Modal state
  isAuthModalOpen: boolean;
  authModalContext: "CUSTOMER" | "VENDOR";
  authModalReturnTo?: string;

  // Active Slot Booking state
  selectedDate: string;
  selectedSlots: Slot[];
  activeResourceId: string | null;

  // Actions
  setSelectedCity: (city: string) => void;
  setSelectedCategory: (category: VenueCategory) => void;
  setSearchQuery: (query: string) => void;
  setSearchModalOpen: (open: boolean) => void;
  openAuthModal: (context?: "CUSTOMER" | "VENDOR", returnTo?: string) => void;
  closeAuthModal: () => void;
  setSelectedDate: (date: string) => void;
  setActiveResourceId: (id: string | null) => void;
  toggleSlot: (slot: Slot) => void;
  addSlot: (slot: Slot) => void;
  removeSlot: (slotId: string) => void;
  clearSelectedSlots: () => void;
}

export const useBookingStore = create<BookingStoreState>((set) => ({
  selectedCity: "Hyderabad",
  selectedCategory: "all",
  searchQuery: "",
  isSearchModalOpen: false,
  
  isAuthModalOpen: false,
  authModalContext: "CUSTOMER",
  authModalReturnTo: undefined,

  selectedDate: "2026-09-18",
  selectedSlots: [],
  activeResourceId: null,

  setSelectedCity: (city) => set({ selectedCity: city }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchModalOpen: (open) => set({ isSearchModalOpen: open }),
  
  openAuthModal: (context = "CUSTOMER", returnTo) =>
    set({
      isAuthModalOpen: true,
      authModalContext: context,
      authModalReturnTo: returnTo,
    }),
  closeAuthModal: () =>
    set({
      isAuthModalOpen: false,
      authModalReturnTo: undefined,
    }),

  setSelectedDate: (date) => set({ selectedDate: date, selectedSlots: [] }),
  setActiveResourceId: (id) => set({ activeResourceId: id, selectedSlots: [] }),
  
  toggleSlot: (slot) =>
    set((state) => {
      const exists = state.selectedSlots.some((s) => s.id === slot.id);
      if (exists) {
        return { selectedSlots: state.selectedSlots.filter((s) => s.id !== slot.id) };
      }
      return { selectedSlots: [...state.selectedSlots, slot] };
    }),

  addSlot: (slot) =>
    set((state) => {
      if (state.selectedSlots.some((s) => s.id === slot.id)) return state;
      return { selectedSlots: [...state.selectedSlots, slot] };
    }),

  removeSlot: (slotId) =>
    set((state) => ({
      selectedSlots: state.selectedSlots.filter((s) => s.id !== slotId),
    })),
    
  clearSelectedSlots: () => set({ selectedSlots: [] }),
}));
