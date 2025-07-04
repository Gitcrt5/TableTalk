import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, User, Eye } from "lucide-react";
import { Link, useParams } from "wouter";
import GameEditForm from "@/components/game-edit-form";
import { useAuth } from "@/hooks/useAuth";
import type { Game, Hand } from "@shared/schema";

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const gameId = parseInt(id!);
  const { user } = useAuth();
  
  // Check if we should auto-open the edit form (from upload redirect)
  const searchParams = new URLSearchParams(window.location.search);
  const shouldAutoEdit = searchParams.get('edit') === 'true';
  
  const { data: game, isLoading: gameLoading } = useQuery<Game>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });

  const { data: hands, isLoading: handsLoading } = useQuery<Hand[]>({
    queryKey: [`/api/games/${gameId}/hands`],
    enabled: !!gameId,
  });

  // Clean up URL parameter after it's been used, but wait for game data to load AND auto-edit to be processed
  useEffect(() => {
    if (shouldAutoEdit && game && user && user.id === game.uploadedBy) {
      // Wait a bit longer to ensure the GameEditForm component has time to process autoOpen
      setTimeout(() => {
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);
      }, 500);
    }
  }, [shouldAutoEdit, game, user]);

  if (gameLoading || handsLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <Skeleton className="h-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Game not found</h2>
            <p className="text-text-secondary mb-4">
              The requested game could not be found.
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Games
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Button>
          </Link>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-text-primary">
              {game.title}
            </h1>
            {user && user.id === game.uploadedBy && (
              <GameEditForm game={game} autoOpen={shouldAutoEdit} />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-text-secondary">
            {game.date && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{game.date}</span>
              </div>
            )}
            
            {game.location && (
              <div className="flex items-center space-x-1">
                <span>📍</span>
                <span className="min-w-[120px]">{game.location}</span>
              </div>
            )}
            
            {game.tournament && (
              <div className="flex items-center space-x-1">
                <span>🏆 {game.tournament}</span>
              </div>
            )}
            
            {game.round && <Badge variant="outline">{game.round}</Badge>}
            
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>Uploaded by {game.uploadedBy}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-xs">
              <span>Uploaded {new Date(game.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hands List */}
      {hands && hands.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Hands ({hands.length})</h2>
            <Badge variant="outline" className="text-xs">
              {hands.filter(h => h.actualBidding && h.actualBidding.length > 0).length} with bidding
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hands.map((hand) => (
              <Card key={hand.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Board {hand.boardNumber}</h3>
                      <p className="text-text-secondary text-sm">
                        Dealer: {hand.dealer} • {hand.vulnerability}
                      </p>
                    </div>
                    {hand.actualBidding && hand.actualBidding.length > 0 ? (
                      <Badge variant="default" className="text-xs">Has bidding</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">No bidding</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {hand.finalContract && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Contract:</span>
                        <span className="font-medium">{hand.finalContract} by {hand.declarer}</span>
                      </div>
                    )}
                    
                    {hand.result && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Result:</span>
                        <span className="font-medium">{hand.result}</span>
                      </div>
                    )}

                    {!hand.finalContract && !hand.result && (
                      <p className="text-text-secondary text-xs italic">
                        Click to view hand layout and add bidding
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link to={`/hands/${hand.id}`}>
                      <Button className="w-full hover:bg-primary/90 transition-colors">
                        <Eye className="mr-2 h-4 w-4" />
                        View Hand
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-text-secondary">
              <h3 className="text-lg font-semibold mb-2">No hands found</h3>
              <p>This game doesn't contain any hands yet.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
