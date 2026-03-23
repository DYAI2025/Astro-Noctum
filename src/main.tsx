import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { PlanetariumProvider } from "./contexts/PlanetariumContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <LanguageProvider>
        <PlanetariumProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </PlanetariumProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
