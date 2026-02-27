import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/context/ThemeContext.tsx";
import { TimerContextProvider } from "@/context/TimerContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TimerContextProvider>
        <App />
      </TimerContextProvider>
    </ThemeProvider>
  </StrictMode>,
);
