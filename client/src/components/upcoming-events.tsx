import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Event, Artist } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, genreColorMap } from "@/lib/utils";
import { EditableImage } from "@/components/editable-image";

const EventCard = ({ event }: { event: Event }) => {
  const eventDate = new Date(event.date);
  const month = eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = eventDate.getDate();

  const genreStyle = genreColorMap[event.genre as keyof typeof genreColorMap] || genreColorMap.default;

  return (
    <Card className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col h-full">
      <div className="relative h-48">
        <EditableImage
          src={event.image_url || ''}
          alt={event.title}
          className="w-full h-full object-cover"
          triggerPosition="bottom-right"
        />
        <div className={`absolute top-4 left-4 ${genreStyle.bg} ${genreStyle.text} text-sm font-accent px-3 py-1 rounded-full`}>
          {event.genre}
        </div>
      </div>
      <CardContent className="p-6 flex flex-col flex-grow">
        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-4 text-center sm:text-left">
          <div className="bg-[#F5F5F5] rounded-lg text-center p-2 mb-3 sm:mb-0 sm:mr-4">
            <span className="block text-sm text-[#333333]/70">{month}</span>
            <span className="block text-xl font-bold">{day}</span>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-xl mb-1">{event.title}</h3>
            <p className="text-[#333333]/70 text-sm">{event.subtitle}</p>
          </div>
        </div>
        
        {event.location && (
          <div className="mb-3 flex items-center justify-center sm:justify-start text-[#333333]/70 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.location}</span>
          </div>
        )}
        
        <div className="mb-5 flex items-center justify-center sm:justify-start text-[#333333]/70 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{`Doors: ${event.doors_time} • Show: ${event.start_time}`}</span>
        </div>
        
        <div className="mt-auto flex justify-center">
          <Button
            asChild
            className="w-full bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white font-accent font-semibold py-2.5 px-6 rounded-full"
          >
            <Link href={event.tickets_url || "#"}>Get Tickets</Link>
          </Button>
        </div>
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
    <section id="events" className="py-16 bg-white content-section">
      <div className="page-container content-wrapper">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Upcoming Events</h2>
          <p className="text-[#333333]/70 max-w-2xl mx-auto">Don't miss our exciting lineup of concerts and shows celebrating healthcare professionals</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden flex flex-col h-full">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6 flex flex-col flex-grow">
                  <div className="flex flex-col sm:flex-row items-center mb-4 w-full">
                    <Skeleton className="h-16 w-16 mb-3 sm:mb-0 sm:mr-4 flex-shrink-0" />
                    <div className="space-y-2 w-full text-center sm:text-left">
                      <Skeleton className="h-7 w-36 sm:w-44 mx-auto sm:mx-0" />
                      <Skeleton className="h-4 w-24 sm:w-32 mx-auto sm:mx-0" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-full mb-3" />
                  <Skeleton className="h-5 w-full mb-6" />
                  <div className="mt-auto">
                    <Skeleton className="h-11 w-full rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-6xl mx-auto">
            {sortedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button
            asChild
            variant="outline"
            className="font-accent font-semibold hover:bg-[#5D3FD3]/10 transition-colors inline-flex items-center gap-2 rounded-full border-[#5D3FD3] text-[#5D3FD3]"
          >
            <Link href="/events">
              View All Events
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;
