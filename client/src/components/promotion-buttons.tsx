import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shirt, ShoppingBag } from "lucide-react";
import nursingRocksLogo from "@assets/1000024136.jpg";

const PromotionButtons = () => {
  const [_, setLocation] = useLocation();

  return (
    <section className="bg-background py-10">
      <div className="container">
        <div className="flex justify-center mb-8">
          <img 
            src={nursingRocksLogo} 
            alt="Nursing Rocks! Concert Series" 
            className="max-w-xs w-full rounded-lg shadow-md"
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <Button 
            onClick={() => setLocation("/store/category/tshirts")}
            className="flex items-center gap-2 bg-[#F61D7A] hover:bg-[#E01060] text-white px-8 py-6 rounded-lg text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full sm:w-auto"
          >
            <Shirt className="h-6 w-6" />
            <span>Nursing Rocks! T-shirts</span>
          </Button>

          <Button 
            onClick={() => setLocation("/store/category/socks")}
            className="flex items-center gap-2 bg-[#00A3E0] hover:bg-[#0089BE] text-white px-8 py-6 rounded-lg text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full sm:w-auto"
          >
            <ShoppingBag className="h-6 w-6" />
            <span>Comfort Socks for Nurses</span>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PromotionButtons;