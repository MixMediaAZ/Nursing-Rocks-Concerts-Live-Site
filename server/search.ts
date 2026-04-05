import { db } from './db';
import { eq, and, or, like, ilike, sql, inArray, gte, lte } from 'drizzle-orm';
import { events, jobListings, nurseProfiles, users } from '@shared/schema';

function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, '\\$&');
}

/**
 * Advanced Search Service
 * Provides full-text and filtered search across jobs, events, and nurses
 */

export interface JobSearchFilters {
  query?: string; // Full-text search in title, description, location
  specialty?: string | string[]; // Filter by specialty
  location?: string; // Filter by location
  salaryMin?: number; // Filter by minimum salary
  salaryMax?: number; // Filter by maximum salary
  verified?: boolean; // Only show from verified employers
  sortBy?: 'relevance' | 'salary' | 'recent'; // Sort order
  limit?: number;
  offset?: number;
}

export interface EventSearchFilters {
  query?: string; // Full-text search in title, description, location
  startDate?: Date; // Filter events from this date onwards
  endDate?: Date; // Filter events before this date
  location?: string; // Filter by location/city
  isFeatured?: boolean; // Filter to featured events only
  sortBy?: 'relevance' | 'date' | 'featured'; // Sort order
  limit?: number;
  offset?: number;
}

export interface NurseSearchFilters {
  query?: string; // Search in name
  specialty?: string; // Filter by specialty
  experience?: number; // Minimum years of experience
  certifications?: string[]; // Filter by certifications
  sortBy?: 'relevance' | 'experience'; // Sort order
  limit?: number;
  offset?: number;
}

/**
 * Search for jobs with advanced filtering
 */
export async function searchJobs(filters: JobSearchFilters) {
  try {
    const whereConditions: any[] = [eq(jobListings.is_approved, true)];
    const limit = Math.max(1, Math.min(filters.limit || 20, 100));
    const offset = Math.max(0, filters.offset || 0);

    // Full-text search
    if (filters.query && filters.query.trim()) {
      const searchQuery = `%${escapeLikePattern(filters.query.trim())}%`;
      whereConditions.push(
        or(
          sql`${jobListings.title} ILIKE ${searchQuery} ESCAPE '\\'`,
          sql`${jobListings.description} ILIKE ${searchQuery} ESCAPE '\\'`,
          sql`${jobListings.location} ILIKE ${searchQuery} ESCAPE '\\'`
        )
      );
    }

    // Specialty filter
    if (filters.specialty) {
      if (Array.isArray(filters.specialty)) {
        whereConditions.push(inArray(jobListings.specialty, filters.specialty));
      } else {
        whereConditions.push(eq(jobListings.specialty, filters.specialty));
      }
    }

    // Location filter
    if (filters.location && filters.location.trim()) {
      const locationQuery = `%${escapeLikePattern(filters.location.trim())}%`;
      whereConditions.push(sql`${jobListings.location} ILIKE ${locationQuery} ESCAPE '\\'`);
    }

    // Salary range filter
    if (filters.salaryMin !== undefined && filters.salaryMin > 0) {
      whereConditions.push(gte(jobListings.salary_max, String(filters.salaryMin)));
    }
    if (filters.salaryMax !== undefined && filters.salaryMax > 0) {
      whereConditions.push(lte(jobListings.salary_min, String(filters.salaryMax)));
    }

    // Build query
    const jobs = await db
      .select()
      .from(jobListings)
      .where(and(...whereConditions))
      .limit(limit)
      .offset(offset);

    // Sort results
    let sorted = jobs;
    switch (filters.sortBy) {
      case 'salary':
        sorted = jobs.sort((a, b) => Number(b.salary_max || 0) - Number(a.salary_max || 0));
        break;
      case 'recent':
        sorted = jobs.sort((a, b) =>
          (b.posted_date?.getTime() || 0) - (a.posted_date?.getTime() || 0)
        );
        break;
      case 'relevance':
      default:
        // Default sort by creation date (newest first)
        sorted = jobs.sort((a, b) =>
          (b.posted_date?.getTime() || 0) - (a.posted_date?.getTime() || 0)
        );
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(jobListings)
      .where(and(...whereConditions));

    const total = countResult[0]?.count || 0;

    return {
      jobs: sorted,
      total: Number(total),
      hasMore: offset + limit < Number(total),
    };
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
}

/**
 * Search for events with advanced filtering
 */
export async function searchEvents(filters: EventSearchFilters) {
  try {
    const whereConditions: any[] = [];
    const limit = Math.max(1, Math.min(filters.limit || 20, 100));
    const offset = Math.max(0, filters.offset || 0);

    // Full-text search
    if (filters.query && filters.query.trim()) {
      const searchQuery = `%${escapeLikePattern(filters.query.trim())}%`;
      whereConditions.push(
        or(
          sql`${events.title} ILIKE ${searchQuery} ESCAPE '\\'`,
          sql`${events.description} ILIKE ${searchQuery} ESCAPE '\\'`,
          sql`${events.location} ILIKE ${searchQuery} ESCAPE '\\'`,
          sql`${events.subtitle} ILIKE ${searchQuery} ESCAPE '\\'`
        )
      );
    }

    // Date range filter
    if (filters.startDate) {
      whereConditions.push(gte(events.date, filters.startDate));
    }
    if (filters.endDate) {
      whereConditions.push(lte(events.date, filters.endDate));
    }

    // Location filter
    if (filters.location && filters.location.trim()) {
      const locationQuery = `%${escapeLikePattern(filters.location.trim())}%`;
      whereConditions.push(sql`${events.location} ILIKE ${locationQuery} ESCAPE '\\'`);
    }

    // Featured filter
    if (filters.isFeatured !== undefined) {
      whereConditions.push(eq(events.is_featured, filters.isFeatured));
    }

    // Build query
    const eventsList = await db
      .select()
      .from(events)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(limit)
      .offset(offset);

    // Sort results
    let sorted = eventsList;
    switch (filters.sortBy) {
      case 'date':
        sorted = eventsList.sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        break;
      case 'featured':
        sorted = eventsList.sort((a, b) =>
          (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
        );
        break;
      case 'relevance':
      default:
        // Default sort by featured first, then by date
        sorted = eventsList.sort((a, b) => {
          if (a.is_featured !== b.is_featured) {
            return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
          }
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(events)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = countResult[0]?.count || 0;

    return {
      events: sorted,
      total: Number(total),
      hasMore: offset + limit < Number(total),
    };
  } catch (error) {
    console.error('Error searching events:', error);
    throw error;
  }
}

/**
 * Search for nurse profiles with filtering
 */
export async function searchNurses(filters: NurseSearchFilters) {
  try {
    const whereConditions: any[] = [eq(users.is_verified, true), eq(nurseProfiles.is_public, true)];
    const limit = Math.max(1, Math.min(filters.limit || 20, 100));
    const offset = Math.max(0, filters.offset || 0);

    // Full-text search in user name
    if (filters.query && filters.query.trim()) {
      const searchQuery = `%${escapeLikePattern(filters.query.trim())}%`;
      whereConditions.push(
        or(
          sql`${users.first_name} ILIKE ${searchQuery} ESCAPE '\\'`,
          sql`${users.last_name} ILIKE ${searchQuery} ESCAPE '\\'`,
          sql`CONCAT(${users.first_name}, ' ', ${users.last_name}) ILIKE ${searchQuery} ESCAPE '\\'`
        )
      );
    }

    // Build query
    const nurses = await db
      .select({
        userId: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
        specialty: nurseProfiles.specialties,
        experience: nurseProfiles.years_of_experience,
        skills: nurseProfiles.skills,
        certifications: nurseProfiles.certifications,
      })
      .from(users)
      .leftJoin(nurseProfiles, eq(users.id, nurseProfiles.user_id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(limit)
      .offset(offset);

    // Apply specialty filter
    let filtered = nurses;
    if (filters.specialty) {
      filtered = nurses.filter(n =>
        n.specialty?.some((s: string) => s.toLowerCase().includes(filters.specialty!.toLowerCase()))
      );
    }

    // Apply experience filter
    if (filters.experience !== undefined && filters.experience > 0) {
      filtered = filtered.filter(n => (n.experience || 0) >= filters.experience!);
    }

    // Apply certifications filter
    if (filters.certifications && filters.certifications.length > 0) {
      filtered = filtered.filter(n => {
        if (!n.certifications || typeof n.certifications !== 'object') return false;
        const certs = Array.isArray(n.certifications) ? n.certifications : [];
        return filters.certifications!.some(cert => certs.includes(cert));
      });
    }

    // Sort
    let sorted = filtered;
    if (filters.sortBy === 'experience') {
      sorted = filtered.sort((a, b) => (b.experience || 0) - (a.experience || 0));
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(users)
      .where(and(...whereConditions));

    const total = countResult[0]?.count || 0;

    return {
      nurses: sorted,
      total: Number(total),
      hasMore: offset + limit < Number(total),
    };
  } catch (error) {
    console.error('Error searching nurses:', error);
    throw error;
  }
}

/**
 * Get search suggestions/autocomplete
 */
export async function getSearchSuggestions(type: 'job' | 'event' | 'location', query: string) {
  try {
    const searchQuery = `${escapeLikePattern(query)}%`;

    switch (type) {
      case 'job':
        const jobSuggestions = await db
          .selectDistinct({ title: jobListings.title })
          .from(jobListings)
          .where(
            and(
              eq(jobListings.is_approved, true),
              sql`${jobListings.title} ILIKE ${searchQuery} ESCAPE '\\'`
            )
          )
          .limit(10);
        return jobSuggestions.map(j => j.title);

      case 'event':
        const eventSuggestions = await db
          .selectDistinct({ title: events.title })
          .from(events)
          .where(sql`${events.title} ILIKE ${searchQuery} ESCAPE '\\'`)
          .limit(10);
        return eventSuggestions.map(e => e.title);

      case 'location':
        // Get distinct locations from both jobs and events
        const jobLocations = await db
          .selectDistinct({ location: jobListings.location })
          .from(jobListings)
          .where(
            and(
              eq(jobListings.is_approved, true),
              sql`${jobListings.location} ILIKE ${searchQuery} ESCAPE '\\'`
            )
          )
          .limit(5);

        const eventLocations = await db
          .selectDistinct({ location: events.location })
          .from(events)
          .where(sql`${events.location} ILIKE ${searchQuery} ESCAPE '\\'`)
          .limit(5);

        const allLocations = new Set<string>();
        jobLocations.forEach(j => j.location && allLocations.add(j.location));
        eventLocations.forEach(e => e.location && allLocations.add(e.location));
        return Array.from(allLocations);

      default:
        return [];
    }
  } catch (error) {
    console.error(`Error getting ${type} suggestions:`, error);
    return [];
  }
}
