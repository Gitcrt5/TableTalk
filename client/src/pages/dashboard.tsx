import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Game } from "@shared/schema";

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

  const recentGames = games.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Quick access to your bridge games and analysis</p>
          </div>
          <Link href="/create-game">
            <Button className="bg-bridge-green hover:bg-green-700">
              <span className="mr-2">+</span>Create Game
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Continue Playing</h3>
                {recentGames.length > 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{recentGames[0].name}</h4>
                        <p className="text-sm text-gray-600">
                          {recentGames[0].totalBoards} boards
                          {recentGames[0].partnerId && " • With partner"}
                        </p>
                      </div>
                      <Link href={`/games/${recentGames[0].id}`}>
                        <Button className="bg-bridge-blue hover:bg-blue-700">
                          Resume
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No games yet. Create your first game to get started!</p>
                    <Link href="/create-game">
                      <Button className="mt-4 bg-bridge-green hover:bg-green-700">
                        Create Game
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Games Played</span>
                  <span className="font-medium">{games.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Boards Analyzed</span>
                  <span className="font-medium">
                    {games.reduce((sum, game) => sum + (game.totalBoards || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Public Games</span>
                  <span className="font-medium">
                    {games.filter(game => game.visibility === 'public').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Games</h3>
              <Link href="/my-games">
                <Button variant="link" className="text-bridge-blue">View All</Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : recentGames.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentGames.map(game => (
                  <div key={game.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate">{game.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        game.visibility === 'public' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {game.visibility}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {new Date(game.createdAt).toLocaleDateString()} • {game.totalBoards} boards
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/games/${game.id}`}>
                        <Button size="sm" className="bg-bridge-green hover:bg-green-700">
                          Open
                        </Button>
                      </Link>
                      <Link href={`/games/${game.id}/boards`}>
                        <Button size="sm" variant="outline">
                          Boards
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No games found. Create your first game to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
