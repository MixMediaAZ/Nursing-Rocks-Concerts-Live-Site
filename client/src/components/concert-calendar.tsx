import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatDate, genreColorMap } from "@/lib/utils";

const CalendarEvents = ({ events }: { events: Event[] }) => {

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b border-[#333333]/10">
          <TableHead className="py-3 px-2 text-left font-heading">Date</TableHead>
          <TableHead className="py-3 px-2 text-left font-heading">Artist</TableHead>
          <TableHead className="py-3 px-2 text-left font-heading">Venue</TableHead>
          <TableHead className="py-3 px-2 text-left font-heading">Time</TableHead>
          <TableHead className="py-3 px-2 text-left font-heading">Genre</TableHead>
          <TableHead className="py-3 px-2 text-right font-heading">Tickets</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => {
          const eventDate = new Date(event.date);
          const day = eventDate.getDate();
          const month = eventDate.toLocaleString('en-US', { month: 'short' });
          const dayName = eventDate.toLocaleString('en-US', { weekday: 'long' });
          
          // Get the style based on genre
          const genreStyle = genreColorMap[event.genre as keyof typeof genreColorMap] || genreColorMap.default;
          
          return (
            <TableRow 
              key={event.id} 
              className="border-b border-[#333333]/10 hover:bg-[#333333]/5 transition-colors"
            >
              <TableCell className="py-4 px-2">
                <div className="font-bold">{`${month} ${day}`}</div>
                <div className="text-[#333333]/70 text-sm">{dayName}</div>
              </TableCell>
              <TableCell className="py-4 px-2">
                <div className="font-bold">{event.title}</div>
                <div className="text-[#333333]/70 text-sm">{event.subtitle}</div>
              </TableCell>
              <TableCell className="py-4 px-2">
                <div>{getVenueName(event.venue_id)}</div>
                <div className="text-[#333333]/70 text-sm">{getVenueLocation(event.venue_id)}</div>
              </TableCell>
              <TableCell className="py-4 px-2">{event.start_time}</TableCell>
              <TableCell className="py-4 px-2">
                <span className={`${genreStyle.bg} ${genreStyle.text} text-xs px-2 py-1 rounded-full`}>
                  {event.genre}
                </span>
              </TableCell>
              <TableCell className="py-4 px-2 text-right">
                <Link 
                  href={event.tickets_url || "#"} 
                  className="text-[#5D3FD3] hover:text-[#FF3366] font-accent font-semibold"
                >
                  Buy Now
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

const ConcertCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const { data: allEvents, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Filter events for the current month
  const filteredEvents = allEvents?.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
  }) || [];
  
  // Sort events by date
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const monthName = new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long' });

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6 md:px-8">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center">Concert Calendar</h2>
        <p className="text-[#333333]/70 text-center mb-12">Browse our upcoming performances by date</p>
        
        <Card className="bg-white rounded-xl p-6 shadow-sm">
          <CardContent className="p-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-heading text-xl font-bold">{`${monthName} ${currentYear}`}</h3>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handlePreviousMonth} 
                  variant="ghost" 
                  size="icon" 
                  className="p-2 rounded-full hover:bg-[#333333]/10 transition-colors"
                >
                  <i className="fas fa-chevron-left"></i>
                </Button>
                <Button 
                  onClick={handleNextMonth} 
                  variant="ghost" 
                  size="icon" 
                  className="p-2 rounded-full hover:bg-[#333333]/10 transition-colors"
                >
                  <i className="fas fa-chevron-right"></i>
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-16 w-16" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedEvents.length > 0 ? (
                <CalendarEvents events={sortedEvents} />
              ) : (
                <div className="text-center py-8 text-[#333333]/70">
                  No events scheduled for {monthName} {currentYear}.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ConcertCalendar;
