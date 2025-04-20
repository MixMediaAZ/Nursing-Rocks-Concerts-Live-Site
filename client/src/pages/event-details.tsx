import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Event, Artist, Venue } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AudioPlayer from "@/components/audio-player";
import { SocialShare } from "@/components/social-share";
import { formatDate } from "@/lib/utils";
import { Calendar, Clock, MapPin, Ticket, Music, Users, Share2 } from "lucide-react";

const EventDetails = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  
  const eventId = id ? parseInt(id) : 0;
  
  const { data: event, isLoading: isLoadingEvent } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });
  
  const { data: artist, isLoading: isLoadingArtist } = useQuery<Artist>({
    queryKey: [`/api/artists/${event?.artist_id}`],
    enabled: !!event?.artist_id,
  });
  
  const { data: venue, isLoading: isLoadingVenue } = useQuery<Venue>({
    queryKey: [`/api/venues/${event?.venue_id}`],
    enabled: !!event?.venue_id,
  });
  
  const { data: galleryImages } = useQuery<{
    id: number;
    image_url: string;
    alt_text: string | null;
  }[]>({
    queryKey: [`/api/gallery/event/${eventId}`],
    enabled: !!eventId,
  });
  
  const isLoading = isLoadingEvent || isLoadingArtist || isLoadingVenue;
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-1/2 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-xl mb-8" />
              <Skeleton className="h-8 w-40 mb-4" />
              <Skeleton className="h-24 w-full mb-6" />
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-xl mb-6" />
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-40 w-full rounded-lg mb-6" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!event || !venue || !artist) {
    return null;
  }
  
  const eventDate = new Date(event.date);
  const formattedDate = formatDate(eventDate);
  
  return (
    <>
      <div className="bg-gradient-to-r from-[#5D3FD3]/90 to-[#FF3366]/90 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold">{event.title}</h1>
              <p className="text-xl mt-2">{event.subtitle}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <SocialShare
                title={`${event.title} - Nursing Rocks Concert Series`}
                description={`Join us at ${venue.name} for ${event.title}. ${event.description?.substring(0, 80)}...`}
                hashtags={['NursingRocks', 'Concert', event.genre ? event.genre.replace(/\s+/g, '') : 'Music'].filter(Boolean) as string[]}
                compact={true}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <img 
                src={event.image_url} 
                alt={event.title} 
                className="w-full h-auto rounded-xl mb-8 shadow-lg" 
              />
              
              <h2 className="font-heading text-2xl font-bold mb-4">Event Details</h2>
              <p className="text-[#333333]/80 mb-4 leading-relaxed">
                {event.description}
              </p>
              
              <div className="mb-6">
                <SocialShare
                  title={`${event.title} - Nursing Rocks Concert Series`}
                  description={`Join us at ${venue.name} for ${event.title}. ${event.description?.substring(0, 80)}...`}
                  hashtags={['NursingRocks', 'Concert', event.genre ? event.genre.replace(/\s+/g, '') : 'Music'].filter(Boolean) as string[]}
                  className="mb-2"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#F5F5F5] p-4 rounded-lg">
                  <div className="flex items-start">
                    <Calendar className="text-[#5D3FD3] mr-3 mt-1" />
                    <div>
                      <h3 className="font-heading font-bold">Date & Time</h3>
                      <p>{formattedDate}</p>
                      <p>Doors: {event.doors_time} | Show: {event.start_time}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#F5F5F5] p-4 rounded-lg">
                  <div className="flex items-start">
                    <Ticket className="text-[#5D3FD3] mr-3 mt-1" />
                    <div>
                      <h3 className="font-heading font-bold">Ticket Information</h3>
                      <p>Price Range: {event.price}</p>
                      <p>Genre: {event.genre}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {galleryImages && galleryImages.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-heading text-2xl font-bold mb-4">Event Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryImages.slice(0, 6).map((image) => (
                      <img 
                        key={image.id}
                        src={image.image_url} 
                        alt={image.alt_text || "Event photo"} 
                        className="w-full h-40 object-cover rounded-lg" 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <div className="bg-white rounded-xl overflow-hidden shadow-lg mb-8">
                <div className="h-48 relative">
                  <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#333333]/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="font-heading font-bold text-xl">{venue.name}</div>
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      <span>{venue.location}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-3">
                    <Users size={16} className="text-[#5D3FD3] mr-2" />
                    <span>Capacity: {venue.capacity}</span>
                  </div>
                  <p className="text-[#333333]/80 text-sm mb-3">
                    {venue.description}
                  </p>
                  <a 
                    href={venue.seating_chart_url || "#"} 
                    className="text-[#5D3FD3] hover:text-[#FF3366] font-accent font-semibold text-sm transition-colors inline-flex items-center"
                  >
                    View Seating Chart
                    <i className="fas fa-angle-right ml-1"></i>
                  </a>
                </div>
              </div>
              
              <div className="bg-white rounded-xl overflow-hidden shadow-lg mb-8">
                <div className="p-6">
                  <h3 className="font-heading text-xl font-bold mb-4 flex items-center">
                    <Music size={20} className="text-[#5D3FD3] mr-2" />
                    {artist.name}
                  </h3>
                  <p className="text-[#333333]/80 text-sm mb-4">
                    {artist.bio?.substring(0, 150)}...
                  </p>
                  
                  <AudioPlayer 
                    songTitle={artist.featured_song || "Featured Track"} 
                    duration={artist.song_duration || "3:45"} 
                  />
                </div>
              </div>
              
              <Button 
                asChild
                className="w-full bg-[#00A3E0] hover:bg-[#00A3E0]/90 text-white font-accent font-semibold py-4 px-8 rounded-full text-lg"
              >
                <a href={event.tickets_url || "#"}>
                  Get Tickets Now
                  <i className="fas fa-ticket-alt ml-2"></i>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventDetails;
