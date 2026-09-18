import { SlotStateType } from "./booking-state";

export type VenueCategory =
  | "all"
  | "cricket"
  | "football"
  | "private-theatre"
  | "party-hall"
  | "resort"
  | "gaming"
  | "swimming"
  | "badminton"
  | "tennis"
  | "pickleball";

export interface CategoryItem {
  id: VenueCategory;
  name: string;
  iconName: string;
  colorClass: string;
  bgClass: string;
  description?: string;
}

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface Slot {
  id: string;
  resourceId: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "10:00"
  timeOfDay: TimeOfDay;
  price: number;
  status: SlotStateType;
}

export interface Resource {
  id: string;
  name: string; // e.g., "Box Cricket Turf #01", "PS5 VIP Pod", "Main Screen 4K"
  category: VenueCategory;
  capacity?: number;
  basePricePerHour: number;
  description?: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface Review {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Venue {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  category: VenueCategory;
  location: {
    address: string;
    city: string;
    neighborhood: string;
    distanceKm: number;
    mapCoordinates?: {
      lat: number;
      lng: number;
    };
  };
  rating: number;
  reviewCount: number;
  startingPrice: number;
  priceUnit: string; // "hour" | "day" | "slot"
  isAvailableToday: boolean;
  isPopular?: boolean;
  isTrending?: boolean;
  images: string[];
  amenities: Amenity[];
  rules: string[];
  resources: Resource[];
  slotsByDate: Record<string, Slot[]>; // Key: YYYY-MM-DD
}

export interface TypedSearchQuery {
  category?: VenueCategory;
  location?: string;
  date?: string;
  time?: string;
  partySize?: number;
  budget?: number;
  rawQuery?: string;
}

export interface BookingSelection {
  venueId: string;
  venueName: string;
  venueLocation: string;
  venueImage: string;
  resourceId: string;
  resourceName: string;
  date: string;
  selectedSlots: Slot[];
  totalPrice: number;
}
