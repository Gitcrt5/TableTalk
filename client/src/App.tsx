import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Dashboard from "@/pages/dashboard";
import BrowseGames from "@/pages/browse-games";
import GameDetail from "@/pages/game-detail";
import Practice from "@/pages/practice";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/browse" component={BrowseGames} />
        <Route path="/games/:id" component={GameDetail} />
        <Route path="/practice" component={Practice} />
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
