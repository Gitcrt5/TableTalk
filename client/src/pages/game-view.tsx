import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Game, Board } from "@shared/schema";

export default function GameView() {
  const { gameId } = useParams<{ gameId: string }>();
  const { token } = useAuth();

  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ['/api/games', gameId],
    enabled: !!gameId,
    queryFn: async () => {
      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch game');
      return response.json() as Promise<Game>;
    },
  });

  const { data: boards = [], isLoading: boardsLoading } = useQuery({
    queryKey: ['/api/games', gameId, 'boards'],
    enabled: !!gameId,
    queryFn: async () => {
      const response = await fetch(`/api/games/${gameId}/boards`);
      if (!response.ok) throw new Error('Failed to fetch boards');
      return response.json() as Promise<Board[]>;
    },
  });

  if (gameLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bridge-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Game Not Found</h1>
          <p className="text-gray-600 mb-4">The game you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/">
            <Button className="bg-bridge-green hover:bg-green-700">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Game Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{game.name}</h1>
            <p className="text-gray-600">
              Created {new Date(game.createdAt).toLocaleDateString()}
              {game.totalBoards > 0 && ` • ${game.totalBoards} boards`}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/games/${gameId}/boards`}>
              <Button variant="outline">
                View All Boards
              </Button>
            </Link>
            <Link href="/create-game">
              <Button className="bg-bridge-green hover:bg-green-700">
                <span className="mr-2">+</span>New Game
              </Button>
            </Link>
          </div>
        </div>

        {game.description && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-gray-700">{game.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Game Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{game.totalBoards}</div>
              <div className="text-sm text-gray-600">Total Boards</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {boards.filter(board => board.contract).length}
              </div>
              <div className="text-sm text-gray-600">Boards Played</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${
                game.visibility === 'public' ? 'text-green-600' : 'text-gray-600'
              }`}>
                {game.visibility === 'public' ? 'Public' : 'Private'}
              </div>
              <div className="text-sm text-gray-600">Visibility</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Boards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Boards</CardTitle>
            {boards.length > 6 && (
              <Link href={`/games/${gameId}/boards`}>
                <Button variant="link" className="text-bridge-blue">
                  View All
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {boardsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bridge-green mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading boards...</p>
            </div>
          ) : boards.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {boards.slice(0, 6).map(board => (
                <div key={board.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Board {board.boardNumber}</h4>
                    <span className="text-xs text-gray-500">
                      {board.dealer} • {board.vulnerability}
                    </span>
                  </div>
                  
                  {board.contract && (
                    <div className="text-sm text-gray-600 mb-3">
                      Contract: {board.contract} {board.declarer}
                      {board.result !== null && board.result !== undefined && (
                        <span className="ml-2">
                          ({board.result} tricks)
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Link href={`/boards/${board.id}`}>
                      <Button size="sm" className="bg-bridge-green hover:bg-green-700">
                        Open
                      </Button>
                    </Link>
                    {board.notes && (
                      <Button size="sm" variant="outline" title="Has notes">
                        📝
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No boards found for this game.</p>
              {game.totalBoards === 0 && (
                <p className="text-sm mt-2">
                  This game was created without a PBN file. You can manually add boards or upload hand records.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
