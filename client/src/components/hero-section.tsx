import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Event, Artist, Venue } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const HeroSection = () => {
  const { data: featuredEvent, isLoading: isLoadingEvent } = useQuery<Event>({
    queryKey: ["/api/events/featured"],
  });

  const { data: artist, isLoading: isLoadingArtist } = useQuery<Artist>({
    queryKey: [`/api/artists/${featuredEvent?.artist_id}`],
    enabled: !!featuredEvent?.artist_id,
  });

  const { data: venue, isLoading: isLoadingVenue } = useQuery<Venue>({
    queryKey: [`/api/venues/${featuredEvent?.venue_id}`],
    enabled: !!featuredEvent?.venue_id,
  });

  const isLoading = isLoadingEvent || isLoadingArtist || isLoadingVenue;

  if (isLoading) {
    return (
      <section className="relative overflow-hidden bg-[#333333] text-white min-h-[500px]">
        <div className="container mx-auto px-4 py-16 md:py-28 relative z-10">
          <div className="max-w-3xl">
            <Skeleton className="h-8 w-32 bg-white/20 mb-4" />
            <Skeleton className="h-16 w-full bg-white/20 mb-4" />
            <Skeleton className="h-12 w-3/4 bg-white/20 mb-6" />
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Skeleton className="h-8 w-56 bg-white/20" />
              <Skeleton className="h-8 w-48 bg-white/20" />
            </div>
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-12 w-36 bg-white/20" />
              <Skeleton className="h-12 w-36 bg-white/20" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredEvent) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-[#333333] text-white">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#5D3FD3]/80 to-[#FF3366]/80 mix-blend-multiply"></div>
        <img
          src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=800&q=80"
          alt="Concert crowd"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-28 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-block bg-[#FF3366] text-white px-4 py-1 rounded-full mb-4 font-accent text-sm">
            HEALTHCARE HEROES CONCERT
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold mb-4">
            {featuredEvent.title}
          </h1>
          <p className="text-xl mb-6">
            {featuredEvent.description || featuredEvent.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex items-center">
              <i className="far fa-calendar-alt mr-2"></i>
              <span>
                {featuredEvent.date
                  ? `${formatDate(featuredEvent.date)} • ${featuredEvent.start_time}`
                  : "Date to be announced"}
              </span>
            </div>
            {venue && (
              <div className="flex items-center">
                <i className="fas fa-map-marker-alt mr-2"></i>
                <span>{`${venue.name} • ${venue.location}`}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              asChild
              className="bg-[#00A3E0] hover:bg-[#00A3E0]/90 text-white font-accent font-semibold py-3 px-8 rounded-full"
            >
              <Link href={featuredEvent.tickets_url || "#"}>
                Get Tickets
                <i className="fas fa-ticket-alt ml-2"></i>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-accent font-semibold py-3 px-8 rounded-full"
            >
              <Link href={`/events/${featuredEvent.id}`}>
                More Info
                <i className="fas fa-arrow-right ml-2"></i>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
