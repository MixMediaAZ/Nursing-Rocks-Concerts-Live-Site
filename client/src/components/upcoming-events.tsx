import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Event, Artist, Venue } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, genreColorMap } from "@/lib/utils";

const EventCard = ({ event }: { event: Event }) => {
  const { data: venue } = useQuery<Venue>({
    queryKey: [`/api/venues/${event.venue_id}`],
  });

  const eventDate = new Date(event.date);
  const month = eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = eventDate.getDate();

  const genreStyle = genreColorMap[event.genre as keyof typeof genreColorMap] || genreColorMap.default;

  return (
    <Card className="bg-white rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
      <div className="relative h-48">
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-4 left-4 ${genreStyle.bg} ${genreStyle.text} text-sm font-accent px-3 py-1 rounded-full`}>
          {event.genre}
        </div>
      </div>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="bg-[#F5F5F5] rounded-lg text-center p-2 mr-4">
            <span className="block text-sm text-[#333333]/70">{month}</span>
            <span className="block text-xl font-bold">{day}</span>
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl">{event.title}</h3>
            <p className="text-[#333333]/70">{event.subtitle}</p>
          </div>
        </div>
        {venue && (
          <div className="mb-4 flex items-center text-[#333333]/70">
            <i className="fas fa-map-marker-alt mr-2"></i>
            <span>{`${venue.name} • ${venue.location}`}</span>
          </div>
        )}
        <div className="mb-6 flex items-center text-[#333333]/70">
          <i className="far fa-clock mr-2"></i>
          <span>{`Doors: ${event.doors_time} • Show: ${event.start_time}`}</span>
        </div>
        <Button
          asChild
          className="w-full bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white font-accent font-semibold py-2.5 px-6 rounded-full"
        >
          <Link href={event.tickets_url || "#"}>Get Tickets</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const UpcomingEvents = () => {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Sort events by date (closest first)
  const sortedEvents = events
    ? [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ).slice(0, 3)
    : [];

  return (
    <section id="events" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="font-heading text-3xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-[#333333]/70">Don't miss our exciting lineup of concerts and shows</p>
          </div>
          <div className="hidden md:block">
            <Link
              href="/events"
              className="text-[#5D3FD3] font-accent font-semibold hover:text-[#FF3366] transition-colors inline-flex items-center"
            >
              View All Events
              <i className="fas fa-long-arrow-alt-right ml-2"></i>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Skeleton className="h-16 w-16 mr-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-36" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-6" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/events"
            className="text-[#5D3FD3] font-accent font-semibold hover:text-[#FF3366] transition-colors inline-flex items-center"
          >
            View All Events
            <i className="fas fa-long-arrow-alt-right ml-2"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;
