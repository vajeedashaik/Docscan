import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";

// Suppress UNSAFE_componentWillMount warning from third-party libraries in development
if (process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    // Suppress Clerk development keys warning in development mode
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Clerk: Clerk has been loaded with development keys')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('UNSAFE_componentWillMount')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>
);
