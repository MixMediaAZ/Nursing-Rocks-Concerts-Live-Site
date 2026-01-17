import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ConcertCalendar = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6 md:px-8">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center">Concert Calendar</h2>
        <p className="text-[#333333]/70 text-center mb-12">Browse our upcoming performances by date</p>
        
        <Card className="bg-white rounded-xl p-12 shadow-sm">
          <CardContent className="p-0">
            <div className="text-center py-12">
              <Clock className="h-16 w-16 mx-auto text-primary mb-6 animate-pulse" />
              <h3 className="text-2xl font-bold mb-4">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our concert calendar is coming soon! Check back later for upcoming events, dates, and ticket information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ConcertCalendar;
