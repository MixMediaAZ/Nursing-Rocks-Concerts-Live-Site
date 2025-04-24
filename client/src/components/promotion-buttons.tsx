import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shirt, ShoppingBag } from "lucide-react";
import nursingRocksLogo from "@assets/NursingRocks_NewLogo.png";

const PromotionButtons = () => {
  const [_, setLocation] = useLocation();

  return (
    <section className="bg-background py-10">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Featured Products</h2>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8 w-full max-w-6xl mx-auto">
          {/* T-shirts promotion */}
          <div className="flex flex-col items-center w-full sm:w-1/2">
            <div className="mb-4 bg-white p-3 rounded-lg shadow-md w-full max-w-sm">
              <img 
                src={nursingRocksLogo} 
                alt="Nursing Rocks! T-shirts" 
                className="w-full h-56 object-contain"
              />
            </div>
            <Button 
              onClick={() => setLocation("/store/category/tshirts")}
              className="flex items-center justify-center gap-3 bg-[#F61D7A] hover:bg-[#E01060] text-white px-8 py-6 rounded-lg text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full max-w-sm"
              id="tshirtButton"
              data-editable="true"
            >
              <Shirt className="h-6 w-6 flex-shrink-0" />
              <span className="text-center" id="tshirtText">Nursing Rocks! T-shirts</span>
            </Button>
          </div>

          {/* Socks promotion */}
          <div className="flex flex-col items-center w-full sm:w-1/2">
            <div className="mb-4 bg-white p-3 rounded-lg shadow-md w-full max-w-sm">
              <img 
                src={nursingRocksLogo} 
                alt="Comfort Socks for Nurses" 
                className="w-full h-56 object-contain"
              />
            </div>
            <Button 
              onClick={() => setLocation("/store/category/socks")}
              className="flex items-center justify-center gap-3 bg-[#00A3E0] hover:bg-[#0089BE] text-white px-8 py-6 rounded-lg text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full max-w-sm"
              id="comfortSocksButton"
              data-editable="true"
            >
              <ShoppingBag className="h-6 w-6 flex-shrink-0" />
              <span className="text-center" id="comfortSocksText">Comfort Socks for Nurses</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionButtons;