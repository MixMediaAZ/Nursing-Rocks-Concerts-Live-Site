import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LicenseVerificationPromo() {
  return (
    <section className="py-16 bg-gradient-to-r from-[#F8F9FA] to-[#E9ECEF]">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-[#5D3FD3]/10 text-[#5D3FD3] font-medium text-sm mb-4">
                EXCLUSIVE FOR NURSES
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Verify Your Nursing License and Get Free Concert Tickets
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                As a thank you for your dedication to healthcare, Nursing Rocks offers all verified 
                nurses complimentary tickets to our concerts and exclusive benefits.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1.5 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">Free concert tickets</span> to all Nursing Rocks events
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1.5 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">Exclusive merchandise</span> only available to verified healthcare professionals
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1.5 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">VIP experiences</span> including meet-and-greets with artists
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1.5 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">Special recognition</span> at events for your contributions to healthcare
                  </p>
                </div>
              </div>
              
              <Button 
                asChild
                className="bg-[#5D3FD3] hover:bg-[#4924C9] text-white font-medium py-2 px-6 rounded-lg"
                size="lg"
              >
                <Link href="/license">
                  Verify Your License Now
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </Button>
            </div>
            
            <div className="flex justify-center items-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#5D3FD3]/20 to-[#9747FF]/20 transform rotate-6"></div>
                <Card className="relative z-10 overflow-hidden rounded-2xl shadow-xl">
                  <CardContent className="p-0">
                    <img 
                      src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=750&q=80"
                      alt="Nurse at a concert" 
                      className="w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6 text-white">
                      <div className="inline-flex items-center gap-2 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-medium mb-2 w-max">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Verified Nurse
                      </div>
                      <h3 className="text-2xl font-bold mb-1">Join thousands of verified nurses</h3>
                      <p className="opacity-90">Enjoy exclusive benefits at our concerts nationwide</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}