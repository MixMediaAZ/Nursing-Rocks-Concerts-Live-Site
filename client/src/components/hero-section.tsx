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
      <section className="relative overflow-hidden bg-[#333333] text-white min-h-[600px]">
        {/* Skeleton for Video Player in Monitor (3 inch) */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20 max-w-[120px] md:max-w-[150px]">
          <div className="relative">
            <Skeleton className="aspect-video w-full rounded-lg bg-black/40" />
            <div className="h-2 bg-[#333] w-1/2 mx-auto rounded-b-md" />
            <div className="h-3 bg-[#222] w-1/4 mx-auto rounded-b-md" />
          </div>
        </div>
      
        <div className="container mx-auto px-4 py-16 md:py-28 relative z-10">
          <div className="max-w-2xl">
            <Skeleton className="h-8 w-32 bg-white/20 mb-4" />
            <Skeleton className="h-16 w-full bg-white/20 mb-4" />
            <Skeleton className="h-12 w-3/4 bg-white/20 mb-6" />
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Skeleton className="h-8 w-56 bg-white/20" />
              <Skeleton className="h-8 w-48 bg-white/20" />
            </div>
            
            {/* Skeleton for store and info buttons */}
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-12 w-36 bg-[#00A3E0]/50" />
              <Skeleton className="h-12 w-36 bg-white/20" />
            </div>
          </div>
        </div>
        
        {/* Skeleton for ticket button at bottom left */}
        <div className="absolute bottom-8 left-8 md:bottom-16 md:left-16 z-20">
          <Skeleton className="h-16 w-80 md:w-96 bg-[#F61D7A]/30 rounded-xl" />
        </div>
      </section>
    );
  }

  if (!featuredEvent) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-[#333333] text-white min-h-[600px]">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#5D3FD3]/80 to-[#FF3366]/80 mix-blend-multiply"></div>
        <img
          src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=800&q=80"
          alt="Concert crowd"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Video Player in Monitor - Upper Right (3 inch) */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20 max-w-[120px] md:max-w-[150px]">
        <div className="relative">
          {/* Monitor Frame */}
          <div className="absolute inset-0 bg-black/80 rounded-lg border-4 border-[#333] shadow-2xl" />
          
          {/* Video Screen */}
          <div className="relative rounded-lg overflow-hidden shadow-inner border-2 border-[#444] aspect-video cursor-pointer group hover:border-[#5D3FD3] transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-[#222] to-[#111]">
              {/* Video Content */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="bg-white/10 rounded-full p-2 group-hover:bg-[#5D3FD3]/30 group-hover:scale-110 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              </div>
              
              {/* Video Title */}
              <div className="absolute bottom-1 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] text-white/80 font-medium bg-black/40 px-1 py-0.5 rounded">
                  Watch Trailer
                </span>
              </div>
            </div>
          </div>
          
          {/* Monitor Base */}
          <div className="h-2 bg-[#333] w-1/2 mx-auto rounded-b-md shadow-md" />
          <div className="h-3 bg-[#222] w-1/4 mx-auto rounded-b-md shadow-md" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-28 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-block bg-[#FF3366] text-white px-4 py-1 rounded-full mb-4 font-accent text-sm">
            HEALTHCARE HEROES CONCERT
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4">
            {featuredEvent.title}
          </h1>
          <p className="text-lg mb-6">
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
              <Link href="/store">
                Visit Our Store
                <i className="fas fa-shopping-bag ml-2"></i>
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
      
      {/* Free Ticket Button - Positioned at bottom left */}
      <div className="absolute bottom-8 left-8 md:bottom-16 md:left-16 z-20">
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-[#F61D7A] to-[#FF3366] hover:from-[#FF3366] hover:to-[#F61D7A] text-white font-accent font-bold text-lg py-6 px-8 rounded-xl shadow-lg transform transition-transform hover:scale-105 w-full md:w-auto animate-pulse"
        >
          <Link href="/register">
            NURSES, GET YOUR FREE TICKETS HERE!
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;
