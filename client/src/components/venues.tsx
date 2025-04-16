import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Venue, Event } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const VenueCard = ({ venue }: { venue: Venue }) => {
  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
  const venueEvents = events?.filter(event => event.venue_id === venue.id) || [];
  const hasUpcomingEvents = venueEvents.length > 0;

  return (
    <Card className="bg-white rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
      <div className="h-48 relative">
        <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#333333]/60 to-transparent"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <div className="font-heading font-bold text-xl">{venue.name}</div>
          <div className="flex items-center">
            <i className="fas fa-map-marker-alt mr-1"></i>
            <span>{venue.location}</span>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <i className="fas fa-users mr-2 text-[#333333]/70"></i>
            <span>Capacity: {venue.capacity}</span>
          </div>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <i 
                key={i} 
                className={`fa${i < venue.rating ? 's' : 'r'} fa-star text-yellow-400`}
              ></i>
            ))}
          </div>
        </div>
        <p className="text-[#333333]/80 mb-4">
          {venue.description}
        </p>
        <div className="flex justify-between">
          <a 
            href={venue.seating_chart_url || "#"} 
            className="text-[#5D3FD3] hover:text-[#FF3366] font-accent font-semibold transition-colors inline-flex items-center"
          >
            View Seating Chart
            <i className="fas fa-angle-right ml-1"></i>
          </a>
          {hasUpcomingEvents ? (
            <Link 
              href={`/venues/${venue.id}`}
              className="text-[#5D3FD3] hover:text-[#FF3366] font-accent font-semibold transition-colors inline-flex items-center"
            >
              Upcoming Events
              <i className="fas fa-angle-right ml-1"></i>
            </Link>
          ) : (
            <span className="text-[#333333]/50 font-accent">No upcoming events</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Venues = () => {
  const { data: venues, isLoading } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
  });

  return (
    <section id="venues" className="py-16 bg-gradient-to-br from-[#5D3FD3]/5 to-[#FF3366]/5">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center">Our Venues</h2>
        <p className="text-[#333333]/70 text-center mb-12">Discover the perfect place to experience live music</p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-20 w-full mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {venues?.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Venues;
