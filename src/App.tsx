
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { useSession } from "./hooks/useSession";

const queryClient = new QueryClient();

function AppRoutes() {
  const { session, loading } = useSession();

  // Show a loading screen until session loads
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/auth"
        element={
          session ? <Navigate to="/" replace /> : <Auth />
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
