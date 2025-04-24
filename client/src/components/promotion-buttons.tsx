import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shirt } from "lucide-react";
import nursingRocksLogo from "@assets/NursingRocks_NewLogo.png";
import { useState } from "react";
import { PromotionButtonEditor } from "./promotion-button-editor";
import { useAdminEditMode } from "@/hooks/use-admin-edit-mode";
import { useToast } from "@/hooks/use-toast";

// T-shirt button component 
function TshirtButton() {
  const [_, setLocation] = useLocation();
  const { isAdminMode } = useAdminEditMode();
  const { toast } = useToast();
  
  // Initialize text from localStorage or default text
  const savedText = localStorage.getItem('tshirtButtonText');
  const [text, setText] = useState(savedText || "Nursing Rocks! T-shirts");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const handleSaveButtonText = (newText: string) => {
    setText(newText);
    setIsEditorOpen(false);
    
    // Save to localStorage for persistence across page reloads
    localStorage.setItem('tshirtButtonText', newText);
    
    toast({
      title: "Button Text Updated",
      description: `Successfully updated the button text to: ${newText}`
    });
  };
  
  return (
    <div className="flex flex-col items-center w-full max-w-xl">
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md w-full" style={{ height: "300px" }}>
        <img 
          src={nursingRocksLogo} 
          alt={text} 
          className="w-full h-full object-contain"
        />
      </div>
      <div className="relative w-full">
        <Button 
          onClick={() => setLocation("/store/category/tshirts")}
          className="flex items-center justify-center gap-4 bg-[#F61D7A] hover:bg-[#E01060] text-white px-10 py-6 rounded-lg text-xl font-semibold transition-transform hover:scale-105 shadow-md w-full"
          id="tshirtButton"
          style={{ minHeight: "72px" }}
        >
          <Shirt className="h-7 w-7 flex-shrink-0" />
          <span className="text-center" id="tshirtText">{text}</span>
        </Button>
        
        {isAdminMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsEditorOpen(true);
            }}
            className="absolute -top-3 -right-3 p-1.5 bg-primary text-white rounded-full shadow-md hover:bg-primary/80 transition-colors z-10"
            title="Edit T-shirt Button Text"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        )}
        
        <PromotionButtonEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          initialText={text}
          buttonId="tshirtButton"
          onSave={handleSaveButtonText}
        />
      </div>
    </div>
  );
}

// Main component
export default function PromotionButtons() {
  return (
    <section className="bg-background py-10">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Featured Products</h2>
        
        <div className="flex justify-center items-center w-full max-w-6xl mx-auto">
          <TshirtButton />
        </div>
      </div>
    </section>
  );
}