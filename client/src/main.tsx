import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add custom styles for the font families
const styleId = 'app-custom-styles';
let styleElement = document.getElementById(styleId) as HTMLStyleElement;

// Only create the style element if it doesn't already exist
if (!styleElement) {
  styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = `
    :root {
      --font-heading: 'Montserrat', sans-serif;
      --font-body: 'Open Sans', sans-serif;
      --font-accent: 'Poppins', sans-serif;
      --color-primary: #5D3FD3;
      --color-secondary: #FF3366;
      --color-accent: #00A3E0;
      --color-dark: #333333;
      --color-light: #F5F5F5;
      --color-success: #2ED573;
      --color-danger: #FF4757;
    }
    
    .font-heading {
      font-family: var(--font-heading);
    }
    
    .font-body {
      font-family: var(--font-body);
    }
    
    .font-accent {
      font-family: var(--font-accent);
    }
  `;
  document.head.appendChild(styleElement);
}

createRoot(document.getElementById("root")!).render(<App />);
