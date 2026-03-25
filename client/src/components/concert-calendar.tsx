import { Card, CardContent } from "@/components/ui/card";

const ConcertCalendar = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6 md:px-8">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center">Concert Calendar</h2>
        <p className="text-[#333333]/70 text-center mb-12">Browse our upcoming performances by date</p>
        
        <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <img
              src="/assets/NRCS Phoenix Poster 1.PNG"
              alt="NRCS Phoenix Concert Poster"
              className="w-full h-auto"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ConcertCalendar;
