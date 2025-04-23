import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Event, Artist } from "@shared/schema";
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

  // Venue queries removed

  const isLoading = isLoadingEvent || isLoadingArtist;

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
            
            {/* Video Placeholder - Responsive across all platforms */}
            <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 lg:bottom-16 lg:right-16 z-20 block">
              <div className="relative">
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 opacity-75 blur-sm"></div>
                <Skeleton className="aspect-video w-[180px] sm:w-[220px] md:w-[320px] lg:w-[380px] bg-black/40 rounded-xl border-4 border-white/20 relative z-10" />
                {/* Play Button Skeleton - Responsive sizing */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-full bg-white/20" />
                </div>
              </div>
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

      <div className="container mx-auto py-16 md:py-28 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-block bg-[#FF3366] text-white px-6 py-3 rounded-full mb-6 font-accent text-2xl md:text-3xl font-bold">
            NURSING ROCKS! CONCERT SERIES
          </div>
          
          <h2 className="font-heading text-base md:text-lg font-semibold mb-4 text-left">
            Mission
          </h2>
          
          <p className="text-lg mb-8 text-left">
            Empowering and honoring nurses through the uplifting power of live music, our mission is to foster a positive impact within the nursing community at nationwide events. We strive to elevate awareness of the nursing profession and support its advancement through scholarship opportunities for further education.
          </p>

          <div className="border-t border-white/20 my-8 pt-6"></div>
          
          {/* Location information if needed */}
          {featuredEvent.location && (
            <div className="flex items-center mb-8">
              <i className="fas fa-map-marker-alt mr-2"></i>
              <span>{featuredEvent.location}</span>
            </div>
          )}
          
          {/* Buttons Column */}
          <div className="flex flex-col gap-4 max-w-sm">
            {/* Free Ticket Button */}
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#F61D7A] to-[#FF3366] hover:from-[#FF3366] hover:to-[#F61D7A] text-white font-accent font-bold text-xs sm:text-sm md:text-base py-4 px-4 sm:px-6 rounded-full shadow-lg transform transition-transform hover:scale-105 animate-pulse"
            >
              <Link href="/register">
                <span className="uppercase">Nurses, Get Your Free Tickets Here!</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 ml-1 sm:ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </Button>
            
            {/* Store Button */}
            <Button
              asChild
              className="bg-[#00A3E0] hover:bg-[#00A3E0]/90 text-white font-accent font-semibold text-xs sm:text-sm md:text-base py-3 px-4 sm:px-6 rounded-full"
            >
              <Link href="/store">
                Visit Our Store
                <i className="fas fa-shopping-bag ml-1 sm:ml-2"></i>
              </Link>
            </Button>
            
            {/* YouTube Video for Mobile Only - Under buttons */}
            <div className="block xs:hidden mt-6 w-full">
              <h4 className="text-center font-semibold mb-2 text-white/90">Featured Video</h4>
              <div className="aspect-video w-full mx-auto bg-black rounded-xl overflow-hidden shadow-xl border-2 border-white/30 transform transition-transform duration-300">
                <div className="glow-effect absolute -inset-1 rounded-xl bg-gradient-to-r from-[#5D3FD3]/80 to-[#FF3366]/80 opacity-50 blur-sm"></div>
                <div className="relative z-10">
                  <YouTube 
                    videoId="dQw4w9WgXcQ" 
                    opts={{
                      width: '100%',
                      height: '100%',
                      playerVars: {
                        autoplay: 0,
                        modestbranding: 1,
                        rel: 0,
                        controls: 1,
                        showinfo: 0,
                        playsinline: 1 // Better for mobile
                      }
                    }}
                    className="w-full h-full"
                    onReady={(event: any) => {
                      // Optional: Add a play button overlay or customize player
                      if (event && event.target && typeof event.target.pauseVideo === 'function') {
                        event.target.pauseVideo();
                      }
                    }}
                  />
                </div>
                {/* Play Indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm opacity-80 hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* YouTube Video - Desktop and Tablet Only - Positioned absolutely on the right */}
        <div className="hidden xs:block absolute bottom-20 xs:bottom-6 right-6 md:bottom-12 md:right-12 lg:bottom-16 lg:right-16 z-20">
          <div className="aspect-video w-[120px] xs:w-[180px] sm:w-[220px] md:w-[320px] lg:w-[380px] bg-black rounded-xl overflow-hidden shadow-xl border-4 border-white/30 transform hover:scale-105 transition-transform duration-300">
            <div className="glow-effect absolute -inset-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-75 blur-sm"></div>
            <div className="relative z-10">
              <YouTube 
                videoId="dQw4w9WgXcQ" 
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 0,
                    modestbranding: 1,
                    rel: 0,
                    controls: 1,
                    showinfo: 0,
                    playsinline: 1 // Better for mobile
                  }
                }}
                className="w-full h-full"
                onReady={(event: any) => {
                  // Optional: Add a play button overlay or customize player
                  if (event && event.target && typeof event.target.pauseVideo === 'function') {
                    event.target.pauseVideo();
                  }
                }}
              />
            </div>
            {/* Play Indicator - Responsive sizing */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/20 rounded-full p-1 xs:p-2 sm:p-3 md:p-4 backdrop-blur-sm opacity-80 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4 xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
