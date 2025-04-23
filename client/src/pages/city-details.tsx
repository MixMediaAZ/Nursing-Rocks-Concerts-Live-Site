import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, Award, Share2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Helmet } from "react-helmet";

// City data type
interface City {
  id: string;
  name: string;
  state: string;
  description: string;
  imageUrl: string;
  location: string;
  upcomingEvents: Array<{
    id: number;
    date: string;
    time: string;
    artist: string;
    description: string;
    imageUrl: string;
    location: string;
  }>;
  scholarships: Array<{
    id: number;
    name: string;
    organization: string;
    amount: string;
    deadline: string;
    description: string;
    applicationUrl: string;
  }>;
}

// Demo city data (would come from API in production)
const CITIES_DATA: Record<string, City> = {
  "chicago": {
    id: "chicago",
    name: "Chicago",
    state: "IL",
    description: "Join us in the Windy City for an unforgettable night celebrating nursing professionals. Our Chicago concert features top rock performers and special moments dedicated to the incredible work of local nurses.",
    imageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1000",
    location: "United Center - 1901 W Madison St, Chicago, IL 60612",
    upcomingEvents: [
      {
        id: 1,
        date: "2025-05-15",
        time: "19:30",
        artist: "The Healing Harmonies",
        description: "Featuring special performances by local nursing choirs and recognition of nurse leaders from Chicago-area hospitals.",
        imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1000",
        location: "United Center - Grand Ballroom"
      },
      {
        id: 2,
        date: "2025-09-22",
        time: "20:00",
        artist: "Cardiac Beats",
        description: "An exclusive concert dedicated to cardiac care nurses, with special appearances by renowned healthcare speakers.",
        imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=1000",
        location: "United Center - Main Arena"
      }
    ],
    scholarships: [
      {
        id: 1,
        name: "Chicago Nurses Foundation Scholarship",
        organization: "Chicago Nurses Foundation",
        amount: "$5,000",
        deadline: "2025-03-15",
        description: "Supporting aspiring nurses in the Chicago metropolitan area, with preference given to those committed to serving underrepresented communities.",
        applicationUrl: "#"
      },
      {
        id: 2,
        name: "Illinois Healthcare Heroes Grant",
        organization: "Illinois Nursing Association",
        amount: "$3,500",
        deadline: "2025-02-28",
        description: "Merit-based scholarships for nursing students showing exceptional promise in clinical practice.",
        applicationUrl: "#"
      }
    ]
  },
  "new-york": {
    id: "new-york",
    name: "New York",
    state: "NY",
    description: "Experience the Nursing Rocks! Concert Series in the Big Apple. Our New York event brings together the city's vibrant energy with our mission to celebrate nursing professionals across America.",
    imageUrl: "https://images.unsplash.com/photo-1587162146766-e06b1189b907?auto=format&fit=crop&q=80&w=1000",
    location: "Javits Center - 429 11th Avenue, New York, NY 10001",
    upcomingEvents: [
      {
        id: 3,
        date: "2025-04-12",
        time: "19:00",
        artist: "Surgical Symphony",
        description: "A special evening highlighting the contributions of surgical nurses, featuring multimedia presentations of nurse stories.",
        imageUrl: "https://images.unsplash.com/photo-1468359601543-843bfaef291a?auto=format&fit=crop&q=80&w=1000",
        location: "Javits Center - Crystal Palace Hall"
      }
    ],
    scholarships: [
      {
        id: 3,
        name: "NYC Health Heroes Scholarship",
        organization: "New York Nurses Association",
        amount: "$7,500",
        deadline: "2025-05-01",
        description: "Supporting NYC nursing students committed to working in underserved communities after graduation.",
        applicationUrl: "#"
      }
    ]
  }
};

export default function CityDetailsPage() {
  const params = useParams<{ cityId: string }>();
  const [_, setLocation] = useLocation();
  const [city, setCity] = useState<City | null>(null);
  
  useEffect(() => {
    // In production, this would be an API call
    if (params.cityId && CITIES_DATA[params.cityId]) {
      setCity(CITIES_DATA[params.cityId]);
    }
  }, [params.cityId]);
  
  if (!city) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">City Not Found</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't find information for the requested city.
        </p>
        <Button onClick={() => setLocation("/cities")}>
          View All Cities
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Nursing Rocks! in {city.name}, {city.state}</title>
        <meta name="description" content={`Join us for the Nursing Rocks! Concert Series in ${city.name}, ${city.state}. Celebrating nursing professionals with special performances and scholarship opportunities.`} />
      </Helmet>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#333333] text-white">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#5D3FD3]/80 to-[#FF3366]/80 mix-blend-multiply"></div>
          <img
            src={city.imageUrl}
            alt={`${city.name} concert`}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10 text-center md:text-left">
          <div className="max-w-3xl mx-auto md:mx-0">
            <div className="inline-block bg-[#FF3366] text-white px-4 py-1 rounded-full mb-4 font-accent text-sm">
              NURSING ROCKS! CONCERT SERIES
            </div>
            <h1 className="font-heading text-4xl md:text-6xl font-bold mb-4">
              {city.name}, {city.state}
            </h1>
            <p className="text-xl mb-6">
              {city.description}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{city.location}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <Button
                asChild
                className="bg-[#00A3E0] hover:bg-[#00A3E0]/90 text-white font-accent font-semibold py-3 px-8 rounded-full"
              >
                <a href="#upcoming-events">
                  View Events
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-accent font-semibold py-3 px-8 rounded-full"
              >
                <a href="#scholarships">
                  Scholarships
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <div className="container py-12">
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="w-full mb-8">
            <TabsTrigger value="events" id="upcoming-events">Upcoming Events</TabsTrigger>
            <TabsTrigger value="scholarships" id="scholarships">Scholarships</TabsTrigger>
          </TabsList>
          
          {/* Upcoming Events Tab */}
          <TabsContent value="events">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upcoming Events in {city.name}</h2>
                <Button variant="link" className="text-primary" asChild>
                  <a href="/register">
                    Nurses Register for Free Tickets
                  </a>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {city.upcomingEvents.map(event => (
                  <Card key={event.id} className="overflow-hidden">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={event.imageUrl} 
                        alt={event.artist}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle>{event.artist}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(event.date).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {event.time} 
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {event.location}
                          </span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{event.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" asChild>
                        <a href={`/events/${event.id}`}>
                          Event Details
                        </a>
                      </Button>
                      <Button>
                        Get Tickets
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {city.upcomingEvents.length === 0 && (
                <div className="text-center py-10 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground font-medium">No upcoming events scheduled in {city.name} yet.</p>
                  <p className="text-sm mt-2 max-w-md mx-auto">Please check back soon or subscribe to our newsletter for updates.</p>
                  <Button variant="outline" className="mt-4">Subscribe to Updates</Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Scholarships Tab */}
          <TabsContent value="scholarships">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Nursing Scholarships in {city.name}</h2>
                <p className="text-muted-foreground">
                  A portion of all ticket sales from the Nursing Rocks! Concert Series goes toward funding these local nursing scholarships.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {city.scholarships.map(scholarship => (
                  <Card key={scholarship.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{scholarship.name}</CardTitle>
                          <CardDescription>{scholarship.organization}</CardDescription>
                        </div>
                        <div className="bg-primary/10 text-primary font-medium px-3 py-1 rounded-full">
                          {scholarship.amount}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{scholarship.description}</p>
                      <div className="flex items-center text-sm">
                        <Award className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Application Deadline: {new Date(scholarship.deadline).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" className="gap-1">
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                      <Button asChild>
                        <a href={scholarship.applicationUrl}>
                          Apply Now
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {city.scholarships.length === 0 && (
                <div className="text-center py-10 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground font-medium">No scholarships available in {city.name} yet.</p>
                  <p className="text-sm mt-2 max-w-md mx-auto">Please check back soon or contact us for more information about upcoming scholarship opportunities.</p>
                  <Button variant="outline" className="mt-4">Contact Us</Button>
                </div>
              )}
              
              <div className="bg-muted p-8 rounded-lg text-center">
                <h3 className="text-xl font-semibold mb-3">How Our Scholarships Work</h3>
                <p className="mb-4 max-w-2xl mx-auto">
                  The Nursing Rocks! Concert Series works with local nursing schools and healthcare organizations to offer scholarships to nursing students in each concert city. These scholarships aim to support the next generation of nursing professionals.
                </p>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                  Interested in establishing a nursing scholarship in your name or your organization's name? Contact us at <span className="font-medium text-primary">scholarships@nursingrocks.com</span> for more information.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}