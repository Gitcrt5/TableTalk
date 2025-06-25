import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import HandDisplay from "@/components/bridge/hand-display";
import BiddingTable from "@/components/bridge/bidding-table";
import BiddingPractice from "@/components/bridge/bidding-practice";
import CommentsSection from "@/components/comments/comments-section";
import { ArrowLeft, Bookmark, Share2, Calendar, User } from "lucide-react";
import { Link, useParams } from "wouter";
import type { Game, Hand } from "@shared/schema";

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const gameId = parseInt(id!);

  const { data: game, isLoading: gameLoading } = useQuery<Game>({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
  });

  const { data: hands, isLoading: handsLoading } = useQuery<Hand[]>({
    queryKey: ["/api/games", gameId, "hands"],
    enabled: !!gameId,
  });

  // For demo, show first hand by default
  const currentHand = hands?.[0];

  if (gameLoading || handsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-64" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-64" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!game || !currentHand) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Game not found</h2>
            <p className="text-text-secondary mb-4">
              The requested game could not be found.
            </p>
            <Link href="/browse">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Browse
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/browse">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Browse
            </Button>
          </Link>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Board {currentHand.boardNumber} - {currentHand.vulnerability} Vulnerable
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-text-secondary">
              {game.tournament && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{game.tournament}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Uploaded by {game.uploadedBy}</span>
              </div>
              
              {game.round && <Badge variant="outline">{game.round}</Badge>}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hand Display */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <HandDisplay hand={currentHand} />
        </CardContent>
      </Card>

      {/* Bidding Comparison */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <BiddingTable
          title="Actual Bidding"
          bidding={currentHand.actualBidding}
          finalContract={currentHand.finalContract}
          declarer={currentHand.declarer}
          icon="gavel"
        />
        
        <BiddingPractice 
          hand={currentHand} 
          userId="current-user" // In real app, get from auth
        />
      </div>

      {/* Hand Navigation */}
      {hands && hands.length > 1 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>All Hands in this Game</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {hands.map((hand) => (
                <Button
                  key={hand.id}
                  variant={hand.id === currentHand.id ? "default" : "outline"}
                  size="sm"
                  className="h-auto p-3"
                >
                  <div className="text-center">
                    <div className="font-semibold">Board {hand.boardNumber}</div>
                    <div className="text-xs text-text-secondary">
                      {hand.vulnerability}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <CommentsSection handId={currentHand.id} />
    </div>
  );
}
