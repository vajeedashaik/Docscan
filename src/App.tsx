import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import Landing from "./pages/Landing";
import DashboardPage from "./pages/DashboardPage";
import OCRPage from "./pages/OCRPage";
import PricingPage from "./pages/PricingPage";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import GmailCallback from "./pages/GmailCallback";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/ocr" element={<OCRPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/auth/gmail-callback" element={<GmailCallback />} />
              <Route element={<><Header /></>}>
                <Route path="/subscription" element={<Subscription />} />
              </Route>
              <Route path="/auth" element={<Auth />} />
              <Route path="/sign-up" element={<Signup />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
