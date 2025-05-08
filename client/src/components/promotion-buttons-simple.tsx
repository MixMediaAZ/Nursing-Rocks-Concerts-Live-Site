import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

/**
 * Simple promotion component that displays:
 * 1. A t-shirt image with no container/background
 * 2. A button directly underneath
 * 
 * This matches exactly the layout in the screenshot
 */
export default function PromotionButtonsSimple() {
  return (
    <section className="bg-[#80d8f7] py-12">
      <div className="container mx-auto text-center">
        {/* Heading */}
        <h2 className="text-2xl font-bold mb-2 text-center text-black">
          Featured Products
        </h2>
        
        {/* View All link */}
        <a 
          href="https://rgwrvu-sq.myshopify.com/" 
          target="_blank" 
          className="text-primary hover:text-primary/80 font-medium underline text-lg inline-block mb-6"
        >
          View All T-shirts
        </a>
        
        {/* T-shirt image - just the image with no container */}
        <div className="flex justify-center mb-4">
          <img 
            src="/assets/tshirts/nursing-rocks-white-tshirt.jpeg"
            alt="Nursing Rocks! T-shirts"
            className="max-w-[200px]"
          />
        </div>
        
        {/* Pink button - full width within container */}
        <div className="max-w-[580px] mx-auto">
          <Button 
            onClick={() => window.open("https://rgwrvu-sq.myshopify.com/", "_blank")}
            className="w-full bg-[#F61D7A] hover:bg-[#E01060] text-white py-4 rounded-lg text-lg font-medium"
          >
            <Gift className="h-5 w-5 mr-2" />
            Nursing Rocks! T-shirts
          </Button>
        </div>
      </div>
    </section>
  );
}