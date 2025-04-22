import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// City background colors and gradients
const cityColors: Record<string, string> = {
  "chicago": "bg-gradient-to-r from-purple-700 to-indigo-800",         // Chicago - Deep purple/indigo
  "washington-dc": "bg-gradient-to-r from-blue-700 to-blue-900",       // Washington DC - Blue tones
  "san-francisco": "bg-gradient-to-r from-cyan-500 to-blue-600",       // San Francisco - Ocean blues
  "boston": "bg-gradient-to-r from-red-800 to-red-900",                // Boston - Historic red tones
  "new-york": "bg-gradient-to-r from-slate-800 to-gray-900",           // New York - Urban grays
  "houston": "bg-gradient-to-r from-red-600 to-orange-700",            // Houston - Warm tones
  "denver": "bg-gradient-to-r from-green-700 to-emerald-900",          // Denver - Mountain greens
  "atlanta": "bg-gradient-to-r from-orange-600 to-red-700",            // Atlanta - Peach-inspired
  "los-angeles": "bg-gradient-to-r from-yellow-500 to-amber-600",      // Los Angeles - Sunny yellows
  "nashville": "bg-gradient-to-r from-indigo-600 to-purple-800",       // Nashville - Music tones
  "dallas": "bg-gradient-to-r from-emerald-600 to-teal-700"            // Dallas - Green/teal
};

// Defined city types with all required information
interface City {
  id: string;
  name: string;
  state: string;
  region: string;
  venueCapacity: number;
  coordinates: { lat: number; lng: number };
  upcomingEvent?: {
    date: string;
    artist: string;
  };
}

// Initial cities list as per requirements
const CITIES: City[] = [
  { 
    id: "chicago", 
    name: "Chicago", 
    state: "IL", 
    region: "Midwest", 
    venueCapacity: 5000,
    coordinates: { lat: 41.8781, lng: -87.6298 },
    upcomingEvent: { date: "2025-05-15", artist: "The Healing Harmonies" }
  },
  { 
    id: "washington-dc", 
    name: "Washington", 
    state: "DC", 
    region: "East", 
    venueCapacity: 3200,
    coordinates: { lat: 38.9072, lng: -77.0369 }
  },
  { 
    id: "san-francisco", 
    name: "San Francisco", 
    state: "CA", 
    region: "West", 
    venueCapacity: 4500,
    coordinates: { lat: 37.7749, lng: -122.4194 },
    upcomingEvent: { date: "2025-06-20", artist: "Medical Mayhem" }
  },
  { 
    id: "boston", 
    name: "Boston", 
    state: "MA", 
    region: "East", 
    venueCapacity: 3800,
    coordinates: { lat: 42.3601, lng: -71.0589 }
  },
  { 
    id: "new-york", 
    name: "New York", 
    state: "NY", 
    region: "East", 
    venueCapacity: 8000,
    coordinates: { lat: 40.7128, lng: -74.0060 },
    upcomingEvent: { date: "2025-04-12", artist: "Surgical Symphony" }
  },
  { 
    id: "houston", 
    name: "Houston", 
    state: "TX", 
    region: "South", 
    venueCapacity: 6000,
    coordinates: { lat: 29.7604, lng: -95.3698 }
  },
  { 
    id: "denver", 
    name: "Denver", 
    state: "CO", 
    region: "West", 
    venueCapacity: 4200,
    coordinates: { lat: 39.7392, lng: -104.9903 },
    upcomingEvent: { date: "2025-07-18", artist: "Cardiac Beats" }
  },
  { 
    id: "atlanta", 
    name: "Atlanta", 
    state: "GA", 
    region: "South", 
    venueCapacity: 5500,
    coordinates: { lat: 33.7490, lng: -84.3880 }
  },
  { 
    id: "los-angeles", 
    name: "Los Angeles", 
    state: "CA", 
    region: "West", 
    venueCapacity: 7500,
    coordinates: { lat: 34.0522, lng: -118.2437 },
    upcomingEvent: { date: "2025-05-30", artist: "The IV League" }
  },
  { 
    id: "nashville", 
    name: "Nashville", 
    state: "TN", 
    region: "South", 
    venueCapacity: 3000,
    coordinates: { lat: 36.1627, lng: -86.7816 }
  },
  { 
    id: "dallas", 
    name: "Dallas", 
    state: "TX", 
    region: "South", 
    venueCapacity: 4800,
    coordinates: { lat: 32.7767, lng: -96.7970 },
    upcomingEvent: { date: "2025-06-10", artist: "Stethoscope Rock" }
  }
];

// Regions for filtering
const REGIONS = ["All", "East", "Midwest", "South", "West"];

// Default background for any cities not in the list
const DEFAULT_BG = "bg-gradient-to-r from-purple-500 to-indigo-600";

export default function CitySelector() {
  const [_, setLocation] = useLocation();
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter cities based on region and search query
  const filteredCities = CITIES.filter(city => {
    const matchesRegion = selectedRegion === "All" || city.region === selectedRegion;
    const matchesSearch = city.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         city.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesSearch;
  });
  
  // Group cities by region for the map view
  const citiesByRegion = REGIONS.slice(1).map(region => ({
    region,
    cities: CITIES.filter(city => city.region === region)
  }));

  // Handle city selection
  const handleCitySelect = (cityId: string) => {
    setLocation(`/cities/${cityId}`);
  };

  return (
    <div className="container py-8">
      <h2 className="text-3xl font-bold text-center mb-8">
        Find a Nursing Rocks! Concert Near You
      </h2>
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>
        
        {/* List View Content */}
        <TabsContent value="list">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cities..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Region Filter */}
              <div className="flex gap-2 overflow-auto pb-2 sm:pb-0">
                {REGIONS.map(region => (
                  <Button
                    key={region}
                    variant={selectedRegion === region ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRegion(region)}
                    className="whitespace-nowrap"
                  >
                    {region}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* City Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCities.map(city => (
                <Card 
                  key={city.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCitySelect(city.id)}
                >
                  <div 
                    className={`h-48 flex items-center justify-center relative ${cityColors[city.id] || DEFAULT_BG}`}
                  >
                    {/* Nursing Rocks overlay pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="w-full h-full bg-repeat" 
                           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                      </div>
                    </div>
                    
                    {/* City name with text shadow for better visibility */}
                    <h3 className="text-3xl text-white font-extrabold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10">
                      {city.name}
                    </h3>
                    
                    {/* Show state abbreviation */}
                    <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white font-medium">
                      {city.state}
                    </div>
                    
                    {/* Event indicator */}
                    {city.upcomingEvent && (
                      <div className="absolute top-3 left-3 bg-white text-xs font-semibold px-2 py-1 rounded-full text-black/80">
                        Upcoming Event
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            
            {filteredCities.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No cities found matching your search.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Map View Content */}
        <TabsContent value="map">
          <div className="flex flex-col space-y-8">
            <div className="relative h-[500px] bg-slate-100 rounded-xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground text-lg">Interactive map will be implemented using Google Maps API</p>
              </div>
              
              {/* City Markers - These would be positioned using actual coordinates in production */}
              {CITIES.map(city => (
                <div 
                  key={city.id}
                  className="absolute w-4 h-4 bg-primary rounded-full cursor-pointer hover:scale-150 transition-transform"
                  style={{ 
                    left: `${((city.coordinates.lng + 125) / 57) * 100}%`, 
                    top: `${((city.coordinates.lat - 25) / -25) * 100}%`
                  }}
                  title={`${city.name}, ${city.state}`}
                  onClick={() => handleCitySelect(city.id)}
                />
              ))}
            </div>
            
            <div className="space-y-6">
              {citiesByRegion.map(regionGroup => (
                <div key={regionGroup.region}>
                  <h3 className="text-xl font-bold mb-4">{regionGroup.region}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {regionGroup.cities.map(city => (
                      <Button 
                        key={city.id} 
                        variant="outline"
                        className="justify-start h-auto py-2"
                        onClick={() => handleCitySelect(city.id)}
                      >
                        <div className="text-left">
                          <div className="font-medium">{city.name}</div>
                          <div className="text-xs text-muted-foreground">{city.state}</div>
                        </div>
                        {city.upcomingEvent && (
                          <div className="ml-auto bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                            Event
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}