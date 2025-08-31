import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Game } from "@shared/schema";
import RecentGamesDashboard from "@/components/RecentGamesDashboard";

export default function Dashboard() {
  const { user, token } = useAuth();

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['/api/games'],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch('/api/games', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json() as Promise<Game[]>;
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Quick access to your bridge games and analysis</p>
          </div>
          <Link href="/create-game">
            <Button variant="primary-green" data-testid="button-create-game">
              <span className="mr-2">+</span>Create Game
            </Button>
          </Link>
        </div>

        <RecentGamesDashboard 
          games={games}
          isLoading={isLoading}
          title="Recent Games"
        />
      </section>
    </div>
  );
}
