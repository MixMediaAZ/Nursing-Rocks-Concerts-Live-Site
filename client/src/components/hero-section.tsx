import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Event, Artist } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useNavigation } from "@/hooks/use-navigation";
import { EditableElement } from "@/components/admin/editable-element";
import { useState, useEffect } from "react";
// Import Cloudinary components
import { CloudinaryIframeVideo } from "@/components/cloudinary-iframe-video";
// Import Cloudinary helpers
import { checkCloudinaryConnection } from "@/lib/cloudinary";

const HeroSection = () => {
  const { navigateTo } = useNavigation();
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [cloudinaryConnected, setCloudinaryConnected] = useState(true);
  const [cloudinaryFolder] = useState("Nursing Rocks! Concerts- video");
  const [videoPublicId, setVideoPublicId] = useState("Nursing Rocks! Concerts- video/d9wtyh03k0tpfsvflagg");
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState<string | null>(null);
  
  // Check Cloudinary connection when component mounts
  useEffect(() => {
    async function checkConnection() {
      try {
        const result = await checkCloudinaryConnection();
        console.log("Cloudinary connection check:", result);
        setCloudinaryConnected(result.connected);
        
        if (result.cloudName) {
          setCloudinaryCloudName(result.cloudName);
        }
        
        if (!result.connected) {
          console.warn("Cloudinary connection failed:", result.message);
        }
      } catch (error) {
        console.error("Error checking Cloudinary connection:", error);
        setCloudinaryConnected(false);
      }
    }
    
    checkConnection();
  }, []);
  
  const { data: featuredEvent, isLoading: isLoadingEvent } = useQuery<Event>({
    queryKey: ["/api/events/featured"],
  });

  const { data: artist, isLoading: isLoadingArtist } = useQuery<Artist>({
    queryKey: [`/api/artists/${featuredEvent?.artist_id}`],
    enabled: !!featuredEvent?.artist_id,
  });

  // Venue queries removed

  const isLoading = isLoadingEvent || isLoadingArtist;

  const handleContentUpdate = (data: any) => {
    // Refresh the component when content is updated
    setRefreshKey(Date.now());
  };

  if (isLoading) {
    return (
      <section className="relative overflow-hidden bg-[#333333] text-white min-h-[600px]">
      
        <div className="mobile-container py-12 sm:py-16 md:py-28 relative z-10">
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

  // Always render the hero section even if no featured event is found
  // This ensures the hero section is always displayed

  return (
    <section className="relative overflow-hidden bg-[#333333] text-white min-h-[800px] sm:min-h-[600px]">
      <div className="absolute inset-0 z-0">
        {/* Editable background image - layer 1 */}
        <EditableElement
          type="image"
          id="hero-background"
          src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=800&q=80"
          alt="Concert crowd with hands raised"
          className="w-full h-full object-cover object-[center_20%] sm:object-center"
          onUpdate={handleContentUpdate}
        />
        
        {/* Gradient overlay - layer 2 - Reduced opacity on mobile to show more of background image */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#5D3FD3]/60 to-[#FF3366]/60 sm:from-[#5D3FD3]/80 sm:to-[#FF3366]/80 mix-blend-multiply"></div>
      </div>

      <div className="mobile-container pt-24 pb-8 sm:py-16 md:py-28 relative z-10">
        <div className="max-w-2xl">
          {/* Editable title */}
          <EditableElement
            type="text"
            id="hero-title"
          >
            <div className="inline-block bg-[#FF3366] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full mb-4 sm:mb-6 font-accent text-lg sm:text-2xl md:text-3xl font-bold">
              NURSING ROCKS! CONCERT SERIES
            </div>
          </EditableElement>
          
          <h2 className="font-heading text-sm sm:text-base md:text-lg font-semibold mb-4 text-left">
            Mission
          </h2>
          
          {/* Editable mission statement */}
          <EditableElement
            type="text"
            id="hero-mission"
          >
            <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-left">
              Empowering and honoring nurses through the uplifting power of live music, our mission is to foster a positive impact within the nursing community at nationwide events. We strive to elevate awareness of the nursing profession and support its advancement through scholarship opportunities for further education.
            </p>
          </EditableElement>

          <div className="border-t border-white/20 my-8 pt-6"></div>
          
          {/* Location information if there's a featured event */}
          {featuredEvent?.location && (
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
            
            {/* Store Button - Redirects to Shopify store */}
            <Button
              className="bg-[#00A3E0] hover:bg-[#00A3E0]/90 text-white font-accent font-semibold text-xs sm:text-sm md:text-base py-3 px-4 sm:px-6 rounded-full"
              onClick={() => window.open('https://rgwrvu-sq.myshopify.com/', '_blank', 'noopener noreferrer')}
            >
              Visit Our Store
              <i className="fas fa-shopping-bag ml-1 sm:ml-2"></i>
            </Button>
            
            {/* Video Upload Button */}
            <Button
              className="bg-[#FF8C00] hover:bg-[#FF6B00] text-white font-accent font-semibold text-xs sm:text-sm md:text-base py-3 px-4 sm:px-6 rounded-full shadow-lg border-2 border-white/30"
              onClick={() => window.open('https://nursingrocksconcerts3.replit.app/thanks', '_blank', 'noopener noreferrer')}
            >
              Upload your video of appreciation here
              <i className="fas fa-video ml-1 sm:ml-2"></i>
            </Button>
            
            {/* Cloudinary Video for Mobile Only - Under buttons */}
            <div className="block xs:hidden mt-6 w-full">
              <h4 className="text-center font-semibold mb-2 text-white/90">Featured Video</h4>
              <div className="aspect-video w-full mx-auto bg-black rounded-xl overflow-hidden shadow-xl border-2 border-white/30 transform transition-transform duration-300">
                <div className="glow-effect absolute -inset-1 rounded-xl bg-gradient-to-r from-[#5D3FD3]/80 to-[#FF3366]/80 opacity-50 blur-sm"></div>
                <div className="relative z-10">
                  <CloudinaryIframeVideo
                    publicId={videoPublicId}
                    className="w-full h-full"
                    autoPlay={true}
                    muted={true}
                    controls={false}
                    loop={true}
                    cloudName={cloudinaryCloudName}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Cloudinary Video - Desktop and Tablet Only - Positioned absolutely on the right with proper spacing */}
        <div className="hidden xs:block absolute bottom-32 xs:bottom-24 right-6 md:bottom-40 md:right-12 lg:bottom-48 lg:right-16 xl:bottom-56 xl:right-20 z-20">
          <div className="aspect-video w-[120px] xs:w-[180px] sm:w-[220px] md:w-[300px] lg:w-[340px] xl:w-[380px] bg-black rounded-xl overflow-hidden shadow-xl border-4 border-white/30 transform hover:scale-105 transition-transform duration-300">
            <div className="glow-effect absolute -inset-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-75 blur-sm"></div>
            <div className="relative z-10">
              <CloudinaryIframeVideo
                publicId={videoPublicId}
                className="w-full h-full"
                autoPlay={true}
                muted={true}
                controls={false}
                loop={true}
                cloudName={cloudinaryCloudName}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
