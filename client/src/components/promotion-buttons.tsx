import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shirt, ShoppingBag, Edit } from "lucide-react";
import nursingRocksLogo from "@assets/NursingRocks_NewLogo.png";
import { useState } from "react";
import { PromotionButtonEditor } from "./promotion-button-editor";
import { useAdminEditMode } from "@/hooks/use-admin-edit-mode";
import { useToast } from "@/hooks/use-toast";

// A simpler promotion button component that handles its own editing
function SimplePromotionButton({
  id,
  textId,
  initialText,
  icon,
  bgColor,
  onClick
}: {
  id: string;
  textId: string;
  initialText: string;
  icon: React.ReactNode;
  bgColor: string;
  onClick: string;
}) {
  const [_, setLocation] = useLocation();
  const { isAdminMode } = useAdminEditMode();
  const { toast } = useToast();
  const [text, setText] = useState(initialText);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const handleSaveButtonText = (newText: string) => {
    setText(newText);
    setIsEditorOpen(false);
    
    // Update the actual DOM element directly
    const textElement = document.getElementById(textId);
    if (textElement) {
      textElement.textContent = newText;
      
      toast({
        title: "Button Text Updated",
        description: `Successfully updated the button text to: ${newText}`
      });
    }
  };
  
  return (
    <div className="flex flex-col items-center w-full sm:w-1/2">
      <div className="mb-4 bg-white p-3 rounded-lg shadow-md w-full max-w-sm">
        <img 
          src={nursingRocksLogo} 
          alt={text} 
          className="w-full h-56 object-contain"
        />
      </div>
      <div className="relative w-full max-w-sm">
        <Button 
          onClick={() => setLocation(onClick)}
          className={`flex items-center justify-center gap-3 ${bgColor} text-white px-8 py-6 rounded-lg text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full`}
          id={id}
          data-editable="true"
        >
          {icon}
          <span className="text-center" id={textId}>{text}</span>
        </Button>
        
        {isAdminMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsEditorOpen(true);
            }}
            className="absolute -top-3 -right-3 p-1.5 bg-primary text-white rounded-full shadow-md hover:bg-primary/80 transition-colors z-10"
            title={`Edit ${text} Button Text`}
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
        
        <PromotionButtonEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          initialText={text}
          buttonId={id}
          onSave={handleSaveButtonText}
        />
      </div>
    </div>
  );
}

// This is our main exported component
export default function PromotionButtons() {
  const [_, setLocation] = useLocation();
  
  return (
    <section className="bg-background py-10">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Featured Products</h2>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8 w-full max-w-6xl mx-auto">
          <SimplePromotionButton 
            id="tshirtButton"
            textId="tshirtText"
            initialText="Nursing Rocks! T-shirts"
            icon={<Shirt className="h-6 w-6 flex-shrink-0" />}
            bgColor="bg-[#F61D7A] hover:bg-[#E01060]"
            onClick="/store/category/tshirts"
          />
          
          {/* Copy Button Feature */}
          <div className="flex flex-col items-center w-full sm:w-1/2">
            <div className="mb-4 bg-white p-3 rounded-lg shadow-md w-full max-w-sm">
              <img 
                src={nursingRocksLogo} 
                alt="Copy feature" 
                className="w-full h-56 object-contain"
              />
            </div>
            <div className="relative w-full max-w-sm">
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText("copy");
                  alert("Text 'copy' has been copied to clipboard!");
                }}
                className="flex items-center justify-center gap-3 bg-[#00A3E0] hover:bg-[#0089BE] text-white px-8 py-6 rounded-lg text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full"
                id="copyButton"
              >
                <ShoppingBag className="h-6 w-6 flex-shrink-0" />
                <span className="text-center" id="copyText">copy</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}