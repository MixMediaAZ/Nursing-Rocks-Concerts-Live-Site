import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shirt } from "lucide-react";
import nursingRocksLogo from "@assets/NursingRocks_NewLogo.png";
import { useState, useEffect, useRef } from "react";
import { PromotionButtonEditor } from "./promotion-button-editor";
import { useAdminEditMode } from "@/hooks/use-admin-edit-mode";
import { useToast } from "@/hooks/use-toast";

// T-shirt button component 
function TshirtButton() {
  const [_, setLocation] = useLocation();
  const { isAdminMode } = useAdminEditMode();
  const { toast } = useToast();
  const [text, setText] = useState("Nursing Rocks! T-shirts");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const handleSaveButtonText = (newText: string) => {
    setText(newText);
    setIsEditorOpen(false);
    
    toast({
      title: "Button Text Updated",
      description: `Successfully updated the button text to: ${newText}`
    });
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
          onClick={() => setLocation("/store/category/tshirts")}
          className="flex items-center justify-center gap-3 bg-[#F61D7A] hover:bg-[#E01060] text-white px-8 py-6 rounded-lg text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full"
          id="tshirtButton"
        >
          <Shirt className="h-6 w-6 flex-shrink-0" />
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

// Static HTML div for "copy" button using useRef and direct DOM creation
function CopyButtonContainer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear the container first to avoid duplicates
    containerRef.current.innerHTML = '';
    
    // Create the image container
    const imageContainer = document.createElement('div');
    imageContainer.className = "mb-4 bg-white p-3 rounded-lg shadow-md w-full max-w-sm";
    
    // Create the image
    const img = document.createElement('img');
    img.src = nursingRocksLogo;
    img.alt = "Copy";
    img.className = "w-full h-56 object-contain";
    imageContainer.appendChild(img);
    
    // Create the button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = "relative w-full max-w-sm";
    
    // Create the link element
    const link = document.createElement('a');
    link.href = "/copy";
    link.className = "flex items-center justify-center gap-3 bg-[#00A3E0] hover:bg-[#0089BE] text-white px-8 py-6 rounded-lg text-lg font-semibold transition-transform hover:scale-105 shadow-md w-full";
    link.style.textDecoration = "none";
    link.style.display = "flex";
    
    // Create the SVG icon
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.style.flexShrink = "0";
    
    // Create the SVG paths
    const path1 = document.createElementNS(svgNS, "path");
    path1.setAttribute("d", "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z");
    svg.appendChild(path1);
    
    const path2 = document.createElementNS(svgNS, "path");
    path2.setAttribute("d", "M3 6h18");
    svg.appendChild(path2);
    
    const path3 = document.createElementNS(svgNS, "path");
    path3.setAttribute("d", "M16 10a4 4 0 0 1-8 0");
    svg.appendChild(path3);
    
    link.appendChild(svg);
    
    // Create the text
    const span = document.createElement('span');
    span.className = "text-center";
    span.textContent = "copy";
    link.appendChild(span);
    
    // Append everything together
    buttonContainer.appendChild(link);
    
    // Append to the container ref
    containerRef.current.appendChild(imageContainer);
    containerRef.current.appendChild(buttonContainer);
  }, []);
  
  return <div ref={containerRef} className="flex flex-col items-center w-full sm:w-1/2"></div>;
}

// Main component
export default function PromotionButtons() {
  return (
    <section className="bg-background py-10">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Featured Products</h2>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8 w-full max-w-6xl mx-auto">
          <TshirtButton />
          <CopyButtonContainer />
        </div>
      </div>
    </section>
  );
}