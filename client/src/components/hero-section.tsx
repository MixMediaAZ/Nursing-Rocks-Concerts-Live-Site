import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Event, Artist, Venue } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useNavigation } from "@/hooks/use-navigation";
import YouTube from 'react-youtube';

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
      
        <div className="container mx-auto px-4 py-16 md:py-28 relative z-10">
          <div className="max-w-2xl">
            <Skeleton className="h-8 w-32 bg-white/20 mb-4" />
            <Skeleton className="h-16 w-full bg-white/20 mb-4" />
            <Skeleton className="h-12 w-3/4 bg-white/20 mb-6" />
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Skeleton className="h-8 w-56 bg-white/20" />
              <Skeleton className="h-8 w-48 bg-white/20" />
            </div>
            
            {/* Skeleton for buttons */}
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <Skeleton className="h-14 w-full bg-[#F61D7A]/30 rounded-full" />
              <Skeleton className="h-12 w-full bg-[#00A3E0]/50 rounded-full" />
            </div>
            
            {/* Video Placeholder - Positioned to the right */}
            <div className="absolute top-16 right-6 md:top-28 md:right-12 lg:top-32 lg:right-16 z-20 hidden sm:block">
              <Skeleton className="aspect-video w-[220px] md:w-[280px] lg:w-[320px] bg-black/40 rounded-lg border-2 border-white/10" />
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
    <section className="relative overflow-hidden bg-[#333333] text-white min-h-[600px]">
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
          <div className="inline-block bg-[#FF3366] text-white px-6 py-3 rounded-full mb-6 font-accent text-2xl md:text-3xl font-bold">
            NURSING ROCKS! CONCERT SERIES
          </div>
          <h2 className="font-heading text-base md:text-lg font-semibold mb-4">
            Mission
          </h2>
          <p className="text-lg mb-8">
            Empowering and honoring nurses through the uplifting power of live music, our mission is to foster a positive impact within the nursing community at nationwide events. We strive to elevate awareness of the nursing profession and support its advancement through scholarship opportunities for further education.
          </p>

          <div className="border-t border-white/20 my-8 pt-6">
            <h3 className="font-heading text-xl font-semibold mb-4">Upcoming Featured Event</h3>
          </div>

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
          
          {/* Buttons Column */}
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {/* Free Ticket Button */}
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#F61D7A] to-[#FF3366] hover:from-[#FF3366] hover:to-[#F61D7A] text-white font-accent font-bold text-sm md:text-lg py-4 px-6 rounded-full shadow-lg transform transition-transform hover:scale-105 animate-pulse"
            >
              <Link href="/register">
                <span className="uppercase">Nurses, Get Your Free Tickets Here!</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </Button>
            
            {/* Store Button */}
            <Button
              asChild
              className="bg-[#00A3E0] hover:bg-[#00A3E0]/90 text-white font-accent font-semibold text-sm md:text-base py-3 px-6 rounded-full"
            >
              <Link href="/store">
                Visit Our Store
                <i className="fas fa-shopping-bag ml-2"></i>
              </Link>
            </Button>
          </div>
          
          {/* YouTube Video - Positioned to the right */}
          <div className="absolute top-16 right-6 md:top-28 md:right-12 lg:top-32 lg:right-16 z-20 hidden sm:block">
            <div className="aspect-video w-[220px] md:w-[280px] lg:w-[320px] bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
              <YouTube 
                videoId="dQw4w9WgXcQ" 
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 0,
                    modestbranding: 1,
                    rel: 0
                  }
                }}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
