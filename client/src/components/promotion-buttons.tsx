import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shirt, ShoppingBag } from "lucide-react";
import nursingRocksLogo from "@assets/NursingRocks_NewLogo.png";

const PromotionButtons = () => {
  const [_, setLocation] = useLocation();

  return (
    <section className="bg-background content-section">
      <div className="page-container content-wrapper">
        <h2 className="text-2xl font-bold mb-8 text-center">Featured Products</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-10 w-full max-w-4xl mx-auto">
          {/* T-shirts promotion */}
          <div className="flex flex-col items-center bg-white/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="mb-4 bg-white p-4 rounded-lg shadow-md center-flex">
              <img 
                src={nursingRocksLogo} 
                alt="Nursing Rocks! T-shirts" 
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
              />
            </div>
            <Button 
              onClick={() => setLocation("/store/category/tshirts")}
              className="flex items-center justify-center gap-3 bg-[#F61D7A] hover:bg-[#E01060] text-white px-6 py-5 rounded-xl text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full"
            >
              <Shirt className="h-6 w-6 flex-shrink-0" />
              <span className="text-center">Nursing Rocks! T-shirts</span>
            </Button>
          </div>

          {/* Socks promotion */}
          <div className="flex flex-col items-center bg-white/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="mb-4 bg-white p-4 rounded-lg shadow-md center-flex">
              <img 
                src={nursingRocksLogo} 
                alt="Comfort Socks for Nurses" 
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
              />
            </div>
            <Button 
              onClick={() => setLocation("/store/category/socks")}
              className="flex items-center justify-center gap-3 bg-[#00A3E0] hover:bg-[#0089BE] text-white px-6 py-5 rounded-xl text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full"
            >
              <ShoppingBag className="h-6 w-6 flex-shrink-0" />
              <span className="text-center">Comfort Socks for Nurses</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionButtons;