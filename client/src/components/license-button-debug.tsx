import { useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function LicenseButtonDebug() {
  const [, navigate] = useLocation();
  
  const handleDirectClick = useCallback(() => {
    navigate("/license");
  }, [navigate]);
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <Button 
        onClick={handleDirectClick} 
        className="bg-blue-500 hover:bg-blue-600"
      >
        Direct Nav to License Page
      </Button>
      
      <Button 
        onClick={() => window.location.href = "/license"}
        className="bg-green-500 hover:bg-green-600"
      >
        Window Location to License
      </Button>
    </div>
  );
}