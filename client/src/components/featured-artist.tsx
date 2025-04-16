import { useQuery } from "@tanstack/react-query";
import { Artist, Event, Venue } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import AudioPlayer from "./audio-player";
import { formatDate } from "@/lib/utils";

const FeaturedArtist = () => {
  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  const featuredArtist = artists?.find(a => a.name === "The Astral Waves");
  
  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
  const artistEvent = events?.find(e => 
    featuredArtist && e.artist_id === featuredArtist.id
  );
  
  const { data: venue, isLoading: isLoadingVenue } = useQuery<Venue>({
    queryKey: [`/api/venues/${artistEvent?.venue_id}`],
    enabled: !!artistEvent?.venue_id,
  });
  
  const isLoading = isLoadingArtists || isLoadingEvents || isLoadingVenue;

  if (isLoading) {
    return (
      <section id="artists" className="py-16 bg-gradient-to-br from-[#5D3FD3]/5 to-[#FF3366]/5">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold mb-2 text-center">Featured Artist</h2>
          <p className="text-[#333333]/70 text-center mb-12">Get to know our headlining performers</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-24 w-full mb-6" />
              
              <div className="mb-8 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-32" />
              </div>
              
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            
            <div className="lg:col-span-3 order-1 lg:order-2">
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredArtist || !artistEvent) {
    return null;
  }

  const socialLinks = featuredArtist.social_links as Record<string, string>;

  return (
    <section id="artists" className="py-16 bg-gradient-to-br from-[#5D3FD3]/5 to-[#FF3366]/5">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center">Featured Artist</h2>
        <p className="text-[#333333]/70 text-center mb-12">Get to know our headlining performers</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <h3 className="font-heading text-3xl md:text-4xl font-bold mb-4">{featuredArtist.name}</h3>
            <p className="text-[#333333]/80 mb-6">
              {featuredArtist.bio}
            </p>
            
            <div className="mb-8">
              <div className="text-[#333333]/80 mb-3">
                <span className="font-bold">Genre:</span> {featuredArtist.genre}
              </div>
              <div className="text-[#333333]/80 mb-3">
                <span className="font-bold">Latest Album:</span> {featuredArtist.latest_album}
              </div>
              <div className="flex gap-4 mb-3">
                {socialLinks && Object.entries(socialLinks).map(([platform, url]) => (
                  <a 
                    key={platform}
                    href={url} 
                    className="text-[#333333] hover:text-[#5D3FD3] transition-colors"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <i className={`fab fa-${platform} text-xl`}></i>
                  </a>
                ))}
              </div>
            </div>

            {/* Audio Player */}
            <AudioPlayer 
              songTitle={featuredArtist.featured_song || "Interstellar Dreams"} 
              duration={featuredArtist.song_duration || "3:45"}
            />
          </div>

          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="relative rounded-xl overflow-hidden shadow-xl">
              <img 
                src={featuredArtist.image_url} 
                alt={featuredArtist.name} 
                className="w-full"
              />
              
              {artistEvent && venue && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#333333]/80 to-transparent p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white text-sm mb-1">Next Performance:</div>
                      <div className="text-white font-bold">
                        {formatDate(artistEvent.date)} • {venue.name}
                      </div>
                    </div>
                    <Button
                      asChild
                      className="bg-[#00A3E0] hover:bg-[#00A3E0]/90 text-white font-accent font-semibold py-2 px-6 rounded-full"
                    >
                      <Link href={artistEvent.tickets_url || "#"}>
                        Get Tickets
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedArtist;
