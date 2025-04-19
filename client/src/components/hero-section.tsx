import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Event, Artist, Venue } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useNavigation } from "@/hooks/use-navigation";

const HeroSection = () => {
  const { navigateTo } = useNavigation();
  
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
            {/* Skeleton for nurse verification and ticket buttons */}
            <div className="mb-8 space-y-4">
              <Skeleton className="h-16 w-full md:w-96 bg-[#5D3FD3]/30" />
              <Skeleton className="h-16 w-full md:w-96 bg-[#F61D7A]/30" />
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

          {/* Prominent Nurse License Verification & Free Ticket Button */}
          <div className="mb-8 space-y-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#5D3FD3] to-[#9747FF] hover:from-[#9747FF] hover:to-[#5D3FD3] text-white font-accent font-bold text-lg py-6 px-8 rounded-xl shadow-lg transform transition-transform hover:scale-105 w-full md:w-auto"
              onClick={() => navigateTo("/license")}
            >
              VERIFY YOUR NURSING LICENSE HERE
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </Button>
            
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#F61D7A] to-[#FF3366] hover:from-[#FF3366] hover:to-[#F61D7A] text-white font-accent font-bold text-lg py-6 px-8 rounded-xl shadow-lg transform transition-transform hover:scale-105 w-full md:w-auto animate-pulse"
            >
              <Link href="/register">
                NURSES GET YOUR FREE TICKETS HERE
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </Button>
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
