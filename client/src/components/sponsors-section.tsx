import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Sample sponsors data
const SPONSORS = [
  {
    id: 1,
    name: "HealthFirst Solutions",
    logo: "https://placehold.co/200x100/e4e4e7/71717a?text=HealthFirst",
    tier: "platinum",
    description: "HealthFirst Solutions is committed to supporting nursing professionals through innovative healthcare technology and generous sponsorship of the Nursing Rocks! Concert Series.",
    website: "#"
  },
  {
    id: 2,
    name: "MediTech Innovations",
    logo: "https://placehold.co/200x100/e4e4e7/71717a?text=MediTech",
    tier: "gold",
    description: "MediTech Innovations creates cutting-edge medical devices while supporting nursing education and professional development through concert sponsorships.",
    website: "#"
  },
  {
    id: 3,
    name: "CarePlus Group",
    logo: "https://placehold.co/200x100/e4e4e7/71717a?text=CarePlus",
    tier: "gold",
    description: "The CarePlus Group believes in celebrating the essential work of nurses through their sponsorship of free concert tickets for nursing professionals.",
    website: "#"
  },
  {
    id: 4,
    name: "Nightingale Supplies",
    logo: "https://placehold.co/200x100/e4e4e7/71717a?text=Nightingale",
    tier: "silver",
    description: "Named after the pioneer of modern nursing, Nightingale Supplies provides quality healthcare products while honoring today's nursing heroes.",
    website: "#"
  },
  {
    id: 5,
    name: "Guardian Health Insurance",
    logo: "https://placehold.co/200x100/e4e4e7/71717a?text=Guardian",
    tier: "silver",
    description: "Guardian Health Insurance supports healthcare professionals through comprehensive insurance solutions and community initiatives like the Nursing Rocks! Concert Series.",
    website: "#"
  },
  {
    id: 6,
    name: "MedEd Publishing",
    logo: "https://placehold.co/200x100/e4e4e7/71717a?text=MedEd",
    tier: "bronze",
    description: "MedEd Publishing creates educational resources for healthcare professionals while supporting nursing excellence through concert sponsorships.",
    website: "#"
  }
];

// Sponsor tier colors and sizing
const TIER_STYLES = {
  platinum: {
    badge: "bg-[#E5E4E2] text-gray-800",
    border: "border-[#E5E4E2]",
    size: "col-span-12 md:col-span-6 lg:col-span-4",
  },
  gold: {
    badge: "bg-[#FFD700]/20 text-amber-700",
    border: "border-amber-200",
    size: "col-span-12 md:col-span-6 lg:col-span-4",
  },
  silver: {
    badge: "bg-gray-200/50 text-gray-700",
    border: "border-gray-200",
    size: "col-span-12 md:col-span-6 lg:col-span-4",
  },
  bronze: {
    badge: "bg-amber-100/30 text-amber-800",
    border: "border-amber-100",
    size: "col-span-12 md:col-span-6 lg:col-span-4",
  }
};

export default function SponsorsSection() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Generous Sponsors</h2>
          <p className="text-muted-foreground mb-6">
            These organizations make the Nursing Rocks! Concert Series possible by purchasing tickets for nursing professionals, supporting our mission to celebrate and honor nurses across America.
          </p>
          <div className="inline-flex gap-2 flex-wrap justify-center">
            <div className="px-3 py-1 text-xs rounded-full bg-[#E5E4E2] text-gray-800">Platinum</div>
            <div className="px-3 py-1 text-xs rounded-full bg-[#FFD700]/20 text-amber-700">Gold</div>
            <div className="px-3 py-1 text-xs rounded-full bg-gray-200/50 text-gray-700">Silver</div>
            <div className="px-3 py-1 text-xs rounded-full bg-amber-100/30 text-amber-800">Bronze</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {SPONSORS.map((sponsor) => (
            <div key={sponsor.id} className="w-full">
              <Card className={`h-full border ${TIER_STYLES[sponsor.tier as keyof typeof TIER_STYLES].border} hover:shadow-md transition-shadow`}>
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-16 w-32 bg-muted/50 rounded flex items-center justify-center overflow-hidden">
                        <img 
                          src={sponsor.logo} 
                          alt={sponsor.name} 
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className={`px-3 py-1 text-xs rounded-full ${TIER_STYLES[sponsor.tier as keyof typeof TIER_STYLES].badge}`}>
                        {sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1)} Sponsor
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2">{sponsor.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4 flex-grow">{sponsor.description}</p>
                    
                    <Button variant="outline" asChild size="sm" className="w-full mt-auto">
                      <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                        Visit Website
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center bg-primary/5 rounded-lg p-8">
          <h3 className="text-xl font-bold mb-2">Become a Sponsor</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join our mission to celebrate nursing professionals across America. By becoming a sponsor, you'll provide free concert tickets to nurses while gaining visibility for your organization.
          </p>
          <Button asChild size="lg">
            <a href="/sponsor-info">
              Sponsorship Information
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}