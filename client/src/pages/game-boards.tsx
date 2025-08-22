import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Game, Board } from "@shared/schema";

export default function GameBoards() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: game } = useQuery({
    queryKey: ['/api/games', gameId],
    enabled: !!gameId,
    queryFn: async () => {
      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch game');
      return response.json() as Promise<Game>;
    },
  });

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['/api/games', gameId, 'boards'],
    enabled: !!gameId,
    queryFn: async () => {
      const response = await fetch(`/api/games/${gameId}/boards`);
      if (!response.ok) throw new Error('Failed to fetch boards');
      return response.json() as Promise<Board[]>;
    },
  });

  const filteredBoards = boards.filter(board => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      board.boardNumber.toString().includes(query) ||
      board.contract?.toLowerCase().includes(query) ||
      board.declarer?.toLowerCase().includes(query) ||
      board.notes?.toLowerCase().includes(query)
    );
  });

  if (!game) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bridge-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/games/${gameId}`}>
              <Button variant="outline" size="sm">
                ← Back to Game
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{game.name} - Boards</h1>
          <p className="text-gray-600">
            {boards.length} boards • {boards.filter(b => b.contract).length} played
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <div className="text-sm text-gray-500">
              {filteredBoards.length} of {boards.length} boards
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bridge-green mx-auto mb-4"></div>
              <p className="text-gray-600">Loading boards...</p>
            </div>
          ) : filteredBoards.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Board</TableHead>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Vulnerability</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Declarer</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBoards.map(board => (
                    <TableRow key={board.id}>
                      <TableCell className="font-medium">
                        {board.boardNumber}
                      </TableCell>
                      <TableCell>{board.dealer}</TableCell>
                      <TableCell>{board.vulnerability}</TableCell>
                      <TableCell>
                        {board.contract || (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {board.declarer || (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {board.result !== null && board.result !== undefined ? (
                          `${board.result} tricks`
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {board.leadCard || (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          board.contract 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {board.contract ? 'Played' : 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/boards/${board.id}`}>
                            <Button size="sm" className="bg-bridge-green hover:bg-green-700 text-white">
                              Open
                            </Button>
                          </Link>
                          {board.notes && (
                            <Button size="sm" variant="outline" title="Has notes">
                              📝
                            </Button>
                          )}
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
                  <p>No boards found matching "{searchQuery}"</p>
                  <Button 
                    variant="link" 
                    onClick={() => setSearchQuery("")}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <p>No boards found for this game.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
