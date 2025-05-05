import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shirt, ShoppingBag, Edit } from "lucide-react";
import nursingRocksLogo from "@assets/NursingRocks_NewLogo.png";
import nursingRocksWhiteTshirt from "@assets/tshirts/nursing-rocks-white-tshirt.jpeg";
import { useState } from "react";
import { PromotionButtonEditor } from "./promotion-button-editor";
import { useAdminEditMode } from "@/hooks/use-admin-edit-mode";
import { useToast } from "@/hooks/use-toast";

const PromotionButtons = () => {
  const [_, setLocation] = useLocation();
  const { isAdminMode } = useAdminEditMode();
  const { toast } = useToast();
  
  // States for the button editor
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentButtonId, setCurrentButtonId] = useState<string>("");
  const [currentButtonText, setCurrentButtonText] = useState<string>("");
  
  // Handler to open the editor for a specific button
  const handleEditButton = (buttonId: string, buttonText: string) => {
    setCurrentButtonId(buttonId);
    setCurrentButtonText(buttonText);
    setIsEditorOpen(true);
  };
  
  // Handler when text is saved
  const handleSaveButtonText = (newText: string) => {
    console.log(`Saved new text for ${currentButtonId}: ${newText}`);
    setIsEditorOpen(false);
    
    toast({
      title: "Button Text Updated",
      description: `Successfully updated the button text.`
    });
  };

  return (
    <>
      <section className="bg-background py-10">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Featured Products</h2>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8 w-full max-w-6xl mx-auto">
            {/* T-shirts promotion */}
            <div className="flex flex-col items-center w-full sm:w-1/2">
              <div className="mb-4 bg-white p-3 rounded-lg shadow-md w-full max-w-sm">
                <img 
                  src={nursingRocksWhiteTshirt} 
                  alt="Nursing Rocks! T-shirts" 
                  className="w-full h-56 object-contain"
                />
              </div>
              <div className="relative w-full max-w-sm">
                <Button 
                  onClick={() => window.open("https://www.bonfire.com/store/nursing-rocks-concert-series", "_blank")}
                  className="flex items-center justify-center gap-3 bg-[#F61D7A] hover:bg-[#E01060] text-white px-8 py-6 rounded-lg text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full"
                  id="tshirtButton"
                  data-editable="true"
                >
                  <Shirt className="h-6 w-6 flex-shrink-0" />
                  <span className="text-center" id="tshirtText">Nursing Rocks! T-shirts</span>
                </Button>
                
                {isAdminMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const textElement = document.getElementById("tshirtText");
                      handleEditButton("tshirtButton", textElement?.textContent || "Nursing Rocks! T-shirts");
                    }}
                    className="absolute -top-3 -right-3 p-1.5 bg-primary text-white rounded-full shadow-md hover:bg-primary/80 transition-colors z-10"
                    title="Edit T-shirt Button Text"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
              </div>
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
              <div className="relative w-full max-w-sm">
                <Button 
                  onClick={() => setLocation("/store/category/socks")}
                  className="flex items-center justify-center gap-3 bg-[#00A3E0] hover:bg-[#0089BE] text-white px-8 py-6 rounded-lg text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full"
                  id="comfortSocksButton"
                  data-editable="true"
                >
                  <ShoppingBag className="h-6 w-6 flex-shrink-0" />
                  <span className="text-center" id="comfortSocksText">Comfort Socks for Nurses</span>
                </Button>
                
                {isAdminMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const textElement = document.getElementById("comfortSocksText");
                      handleEditButton("comfortSocksButton", textElement?.textContent || "Comfort Socks for Nurses");
                    }}
                    className="absolute -top-3 -right-3 p-1.5 bg-primary text-white rounded-full shadow-md hover:bg-primary/80 transition-colors z-10"
                    title="Edit Socks Button Text"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Specialized button editor for handling our promotional buttons */}
      <PromotionButtonEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        initialText={currentButtonText}
        buttonId={currentButtonId}
        onSave={handleSaveButtonText}
      />
    </>
  );
};

export default PromotionButtons;