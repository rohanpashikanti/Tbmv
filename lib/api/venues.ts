import { VENUES } from "@/lib/mock-data";
import { Venue, VenueCategory } from "@/types/venue";

export interface GetVenuesParams {
  city?: string;
  category?: VenueCategory;
  query?: string;
}

export async function getVenues(params?: GetVenuesParams): Promise<Venue[]> {
  // In Milestone 2, this will query PostgreSQL via Prisma with Redis caching
  let results = [...VENUES];

  if (params?.city && params.city !== "Hyderabad") {
    results = results.filter(
      (v) => v.location.city.toLowerCase() === params.city?.toLowerCase()
    );
  }

  if (params?.category && params.category !== "all") {
    results = results.filter((v) => v.category === params.category);
  }

  if (params?.query) {
    const q = params.query.toLowerCase();
    results = results.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.location.neighborhood.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
    );
  }

  return results;
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  // In Milestone 2, this will fetch from PostgreSQL database
  const venue = VENUES.find((v) => v.slug === slug);
  return venue || null;
}
