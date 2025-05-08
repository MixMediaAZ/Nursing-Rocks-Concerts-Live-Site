import { Button } from "@/components/ui/button";
import { Shirt } from "lucide-react";

/**
 * Simple promotion component that displays:
 * 1. A t-shirt image with no container/background
 * 2. A button directly underneath
 */
export default function PromotionButtonsSimple() {
  // T-shirt image and button text
  const shirtImage = "/assets/tshirts/nursing-rocks-white-tshirt.jpeg";
  const buttonText = "Nursing Rocks! T-shirts";
  
  return (
    <section className="bg-background py-10">
      <div className="container mx-auto">
        {/* Heading and "View All" link */}
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-center">
            Featured Products
          </h2>
          <Button
            variant="link"
            className="text-primary hover:text-primary/80 font-medium underline text-lg"
            onClick={() => window.open("https://rgwrvu-sq.myshopify.com/", "_blank")}
          >
            View All T-shirts
          </Button>
        </div>
        
        {/* T-shirt image and button */}
        <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
          {/* Image with no container */}
          <img 
            src={shirtImage}
            alt={buttonText}
            className="w-full object-contain"
            style={{ maxHeight: "300px" }}
          />
          
          {/* Button */}
          <Button 
            onClick={() => window.open("https://rgwrvu-sq.myshopify.com/", "_blank")}
            className="flex items-center justify-center gap-3 bg-[#F61D7A] hover:bg-[#E01060] text-white px-8 py-4 rounded-lg text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full"
          >
            <Shirt className="h-5 w-5 flex-shrink-0" />
            <span>{buttonText}</span>
          </Button>
        </div>
      </div>
    </section>
  );
}