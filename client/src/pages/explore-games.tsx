import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Game } from "@shared/schema";

export default function ExploreGames() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['/api/games/public'],
    queryFn: async () => {
      const response = await fetch('/api/games/public');
      if (!response.ok) throw new Error('Failed to fetch public games');
      return response.json() as Promise<Game[]>;
    },
  });

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['/api/games/search', searchQuery],
    enabled: searchQuery.length > 2,
    queryFn: async () => {
      const response = await fetch(`/api/games/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search games');
      return response.json() as Promise<Game[]>;
    },
  });

  const displayGames = searchQuery.length > 2 ? searchResults : games;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Explore Public Games</h1>
        <p className="text-gray-600">Discover and learn from games shared by other players</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search public games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <div className="text-sm text-gray-500">
              {displayGames.length} games found
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading || isSearching ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bridge-green mx-auto mb-4"></div>
          <p className="text-gray-600">
            {searchQuery.length > 2 ? "Searching games..." : "Loading public games..."}
          </p>
        </div>
      ) : displayGames.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayGames.map(game => (
            <Card key={game.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 truncate">{game.name}</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full shrink-0">
                    public
                  </span>
                </div>
                
                {game.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {game.description}
                  </p>
                )}
                
                <div className="text-xs text-gray-500 mb-4">
                  {new Date(game.createdAt).toLocaleDateString()} • {game.totalBoards} boards
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/games/${game.id}`}>
                    <Button size="sm" className="bg-bridge-green hover:bg-green-700 text-white">
                      Open
                    </Button>
                  </Link>
                  <Link href={`/games/${game.id}/boards`}>
                    <Button size="sm" variant="outline">
                      View Boards
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          {searchQuery.length > 2 ? (
            <>
              <p>No games found matching "{searchQuery}"</p>
              <Button 
                variant="link" 
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                Clear search
              </Button>
            </>
          ) : (
            <p>No public games available yet. Be the first to share your games!</p>
          )}
        </div>
      )}
    </div>
  );
}
