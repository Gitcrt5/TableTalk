import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Dashboard from "@/pages/dashboard";
import GameDetail from "@/pages/game-detail";
import HandDetail from "@/pages/hand-detail";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check if we're using Replit auth (presence of REPLIT_DOMAINS means we're on Replit)
  const isReplitAuth = import.meta.env.VITE_USE_REPLIT_AUTH !== "false";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Use different landing pages based on auth method
    return isReplitAuth ? <Landing /> : <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/games/:id" component={GameDetail} />
        <Route path="/hands/:id" component={HandDetail} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
