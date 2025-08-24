import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";

// Pages
import Dashboard from "@/pages/dashboard";
import MyGames from "@/pages/my-games";
import ExploreGames from "@/pages/explore-games";
import BoardView from "@/pages/board-view";
import GameBoards from "@/pages/game-boards";
import GameView from "@/pages/game-view";
import Events from "@/pages/events";
import Partnerships from "@/pages/partnerships";
import CreateGame from "@/pages/create-game";
import Admin from "@/pages/admin";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bridge-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <Component />;
}

function Router() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />

      <main className="flex-1">
        <Switch>
          <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/my-games" component={() => <ProtectedRoute component={MyGames} />} />
          <Route path="/explore" component={ExploreGames} />
          <Route path="/events" component={Events} />
          <Route path="/partnerships" component={() => <ProtectedRoute component={Partnerships} />} />
          <Route path="/create-game" component={() => <ProtectedRoute component={CreateGame} />} />
          <Route path="/games/:gameId" component={() => <ProtectedRoute component={GameView} />} />
          <Route path="/games/:gameId/boards" component={() => <ProtectedRoute component={GameBoards} />} />
          <Route path="/boards/:boardId" component={() => <ProtectedRoute component={BoardView} />} />
          <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
          <Route path="/auth" component={Auth} />
          <Route component={NotFound} />
        </Switch>
      </main>

      <AppFooter />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;