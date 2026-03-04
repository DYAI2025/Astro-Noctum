import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { PlanetariumProvider } from "./contexts/PlanetariumContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <PlanetariumProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PlanetariumProvider>
    </LanguageProvider>
  </StrictMode>,
);
