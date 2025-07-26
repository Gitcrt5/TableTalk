import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Edit2, Users, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface LiveGame {
  id: number;
  title: string;
  clubId: number;
  clubName?: string;
  gameDate: string;
  createdBy: string;
  partnerId?: string;
  partnerName?: string;
  status: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

interface LiveHand {
  id: number;
  liveGameId: number;
  boardNumber: number;
  dealer?: string;
  vulnerability?: string;
  northHand?: string;
  southHand?: string;
  eastHand?: string;
  westHand?: string;
  biddingSequence?: string[];
  openingLead?: string;
  tricksTaken?: number;
  notes?: string;
  lastModified: string;
}

export default function LiveGameDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [partnerEmail, setPartnerEmail] = useState("");
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);

  const { data: game, isLoading: gameLoading } = useQuery<LiveGame>({
    queryKey: [`/api/live-games/${id}`],
  });

  const { data: hands = [], isLoading: handsLoading } = useQuery<LiveHand[]>({
    queryKey: [`/api/live-games/${id}/hands`],
  });

  const finalizeGameMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/live-games/${id}/finalize`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/live-games/${id}`] });
      toast({
        title: "Game Finalized",
        description: "The live game has been converted to a completed game.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to finalize the game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest(`/api/live-games/${id}/partner`, {
        method: "PUT",
        body: JSON.stringify({ partnerEmail: email }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/live-games/${id}`] });
      setIsPartnerDialogOpen(false);
      setPartnerEmail("");
      toast({
        title: "Partner Updated",
        description: "Partner information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update partner. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFinalizeGame = () => {
    finalizeGameMutation.mutate();
  };

  const handleUpdatePartner = () => {
    if (!partnerEmail.trim()) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    updatePartnerMutation.mutate(partnerEmail.trim());
  };

  if (gameLoading || handsLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Live game not found.</p>
            <Link href="/live-games">
              <Button>Back to Live Games</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create array of boards (1-24 for a typical game)
  const boardNumbers = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Compact Game Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Link href="/live-games">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge 
              variant={game.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {game.status}
            </Badge>
            
            {/* Partner Management */}
            <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  {game.partnerName ? "Change Partner" : "Add Partner"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Partner</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="partner-email">Partner Email</Label>
                    <Input
                      id="partner-email"
                      type="email"
                      placeholder="Enter partner's email address"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsPartnerDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdatePartner}
                      disabled={updatePartnerMutation.isPending}
                    >
                      {updatePartnerMutation.isPending ? "Updating..." : "Update Partner"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Finalize Game */}
            {game.status === 'active' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalize Game
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Finalize Live Game</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will convert your live game to a completed game. The game status will change to "completed" and you won't be able to make further edits to the boards.
                      <br /><br />
                      Are you sure you want to finalize this game?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleFinalizeGame}
                      disabled={finalizeGameMutation.isPending}
                    >
                      {finalizeGameMutation.isPending ? "Finalizing..." : "Finalize Game"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <h1 className="text-xl font-bold mb-1">{game.title}</h1>
        <div className="text-sm text-muted-foreground">
          {format(new Date(game.gameDate), 'MMM d')} • {game.clubName}
          {game.partnerName && ` • Partner: ${game.partnerName}`}
        </div>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {boardNumbers.map((boardNumber) => {
          const hand = hands.find(h => h.boardNumber === boardNumber);

          return (
            <Card key={boardNumber} className={hand ? "border-green-200 bg-green-50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Board {boardNumber}</h3>
                  <Link href={`/live-games/${id}/board/${boardNumber}`}>
                    <Button variant="ghost" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {hand ? (
                  <div className="space-y-2">
                    {/* Hand info */}
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dealer:</span>
                        <span>{hand.dealer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vul:</span>
                        <span>{hand.vulnerability}</span>
                      </div>
                    </div>

                    {/* Bidding status */}
                    {hand.biddingSequence && hand.biddingSequence.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Bidding:</div>
                        <div className="bg-muted p-2 rounded">
                          <div className="grid grid-cols-4 gap-1 text-center text-xs font-medium mb-1">
                            <span>N</span><span>E</span><span>S</span><span>W</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center text-xs">
                            {Array.from({ length: Math.max(4, hand.biddingSequence.length) }).map((_, i) => {
                              const bid = hand.biddingSequence![i];
                              const isRedBid = bid && (bid.includes('♥') || bid.includes('♦'));
                              return (
                                <div key={i} className={`p-1 min-h-[20px] bg-background rounded ${isRedBid ? 'text-red-600' : ''}`}>
                                  {bid || '-'}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Play info */}
                    {(hand.openingLead || hand.tricksTaken !== undefined) && (
                      <div className="text-sm space-y-1">
                        {hand.openingLead && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Lead:</span>
                            <span className={hand.openingLead.includes('♥') || hand.openingLead.includes('♦') ? 'text-red-600' : ''}>
                              {hand.openingLead}
                            </span>
                          </div>
                        )}
                        {hand.tricksTaken !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tricks:</span>
                            <span>{hand.tricksTaken}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {hand.notes && (
                      <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                        {hand.notes}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <div className="text-sm mb-2">Click to enter bidding</div>
                    <div className="text-xs">Board {boardNumber}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}