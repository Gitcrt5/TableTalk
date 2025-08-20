import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { Game } from "@shared/schema";

export default function MyGames() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Games</h1>
          <p className="text-gray-600">Manage and review your bridge games</p>
        </div>
        <Link href="/create-game">
          <Button className="bg-bridge-green hover:bg-green-700">
            <span className="mr-2">+</span>Create Game
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <div className="text-sm text-gray-500">
              {filteredGames.length} of {games.length} games
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bridge-green mx-auto mb-4"></div>
              <p className="text-gray-600">Loading games...</p>
            </div>
          ) : filteredGames.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Boards</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGames.map(game => (
                    <TableRow key={game.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{game.name}</div>
                          {game.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {game.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(game.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{game.totalBoards}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          game.visibility === 'public' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {game.visibility}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? (
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
                <>
                  <p>No games found. Create your first game to get started!</p>
                  <Link href="/create-game">
                    <Button className="mt-4 bg-bridge-green hover:bg-green-700">
                      Create Game
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
