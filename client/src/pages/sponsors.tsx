import SponsorsSection from "@/components/sponsors-section";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import sponsorshipOverview from "@assets/NRCS Sponsorship Overview.png";

export default function SponsorsPage() {
  return (
    <>
      <Helmet>
        <title>Nursing Rocks! Concert Series - Our Sponsors</title>
        <meta name="description" content="Meet the generous sponsors who make the Nursing Rocks! Concert Series possible by providing free tickets for nursing professionals across America." />
      </Helmet>
      
      <div className="py-8 sm:py-10 bg-gradient-to-r from-[#5D3FD3]/5 to-[#FF3366]/5">
        <div className="mobile-container text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Our Sponsors</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            We celebrate the organizations that make our concerts free for nurses through their generous support.
          </p>
        </div>
      </div>
      
      {/* NRCS Sponsorship Overview */}
      <div className="mobile-container py-8 sm:py-12">
        <div className="max-w-5xl mx-auto text-center">
          <img 
            src={sponsorshipOverview} 
            alt="NRCS Sponsorship Overview - Event, Regional, and National sponsorship opportunities with pricing tiers" 
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      </div>
      
      <div className="container px-6 md:px-8 py-8">
        <SponsorsSection />
      </div>
      
      <section className="py-10 container px-6 md:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6">Sponsorship Benefits</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Brand Visibility</h3>
                  <p className="text-muted-foreground">Your brand will be featured prominently at all concert venues, on our website, and in promotional materials.</p>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Healthcare Network Access</h3>
                  <p className="text-muted-foreground">Connect with nursing professionals who attend our concerts and build relationships with key healthcare institutions.</p>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Community Goodwill</h3>
                  <p className="text-muted-foreground">Demonstrate your organization's commitment to celebrating and honoring the nursing profession.</p>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">VIP Access</h3>
                  <p className="text-muted-foreground">Receive exclusive access to VIP areas, meet-and-greets with performers, and special recognition at events.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-6">Sponsorship Tiers</h2>
            <div className="space-y-6">
              <div className="border rounded-lg p-6 bg-[#E5E4E2]/20 border-[#E5E4E2]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Platinum Sponsor</h3>
                  <div className="px-3 py-1 text-xs rounded-full bg-[#E5E4E2] text-gray-800">
                    $50,000+
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Premier visibility with logo placement on main stage, program covers, and all promotional materials. 
                  Includes 50 VIP tickets per concert and exclusive meet-and-greet opportunities.
                </p>
                <Button variant="outline" size="sm">Learn More</Button>
              </div>
              
              <div className="border rounded-lg p-6 bg-[#FFD700]/10 border-amber-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Gold Sponsor</h3>
                  <div className="px-3 py-1 text-xs rounded-full bg-[#FFD700]/20 text-amber-700">
                    $25,000+
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Prominent logo placement on event signage and digital materials.
                  Includes 25 VIP tickets per concert and special recognition during events.
                </p>
                <Button variant="outline" size="sm">Learn More</Button>
              </div>
              
              <div className="border rounded-lg p-6 bg-gray-50 border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Silver Sponsor</h3>
                  <div className="px-3 py-1 text-xs rounded-full bg-gray-200/50 text-gray-700">
                    $10,000+
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Logo placement in event programs and website.
                  Includes 10 VIP tickets per concert and recognition in promotional materials.
                </p>
                <Button variant="outline" size="sm">Learn More</Button>
              </div>
              
              <div className="border rounded-lg p-6 bg-amber-50/50 border-amber-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Bronze Sponsor</h3>
                  <div className="px-3 py-1 text-xs rounded-full bg-amber-100/30 text-amber-800">
                    $5,000+
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Logo placement on website and mention in event programs.
                  Includes 5 VIP tickets per concert.
                </p>
                <Button variant="outline" size="sm">Learn More</Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 p-8 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Become a Sponsor?</h2>
          <p className="max-w-2xl mx-auto mb-6 text-muted-foreground">
            Join our growing community of organizations committed to celebrating nursing professionals. 
            Contact our sponsorship team to discuss how your organization can participate.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg">
              Request Sponsorship Information
            </Button>
            <Button variant="outline" size="lg">
              Contact Sponsorship Team
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}