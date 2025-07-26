import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ArrowLeft, Plus, Calendar, MapPin, Users, Edit2, Save, X, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BiddingTable from "@/components/bridge/bidding-table";

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
  scoreMp?: string;
  scoreImp?: string;
  notes?: string;
  lastModified: string;
}

export default function LiveGameDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingBoard, setEditingBoard] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<LiveHand>>({});
  const [currentBidding, setCurrentBidding] = useState<string[]>([]);
  const [currentTricks, setCurrentTricks] = useState<number>(7);

  const { data: game, isLoading: gameLoading } = useQuery<LiveGame>({
    queryKey: [`/api/live-games/${id}`],
  });

  const { data: hands = [], isLoading: handsLoading } = useQuery<LiveHand[]>({
    queryKey: [`/api/live-games/${id}/hands`],
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: Partial<LiveHand>) => {
      return apiRequest(`/api/live-games/${id}/hands`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/live-games/${id}/hands`] });
      setEditingBoard(null);
      setFormData({});
      toast({
        title: "Board saved",
        description: "Board details have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save board. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEditingBoard = (boardNumber: number) => {
    const existingHand = hands.find(h => h.boardNumber === boardNumber);
    setFormData(existingHand || { boardNumber });
    setCurrentBidding(existingHand?.biddingSequence || []);
    setCurrentTricks(existingHand?.tricksTaken || 7);
    setEditingBoard(boardNumber);
  };

  // Bidding helper functions
  const addBid = (bid: string) => {
    const newBidding = [...currentBidding, bid];
    setCurrentBidding(newBidding);
    setFormData({ ...formData, biddingSequence: newBidding });
  };

  const undoBid = () => {
    if (currentBidding.length > 0) {
      const newBidding = currentBidding.slice(0, -1);
      setCurrentBidding(newBidding);
      setFormData({ ...formData, biddingSequence: newBidding });
    }
  };

  const clearBidding = () => {
    setCurrentBidding([]);
    setFormData({ ...formData, biddingSequence: [] });
  };

  // Trick counter helpers
  const adjustTricks = (delta: number) => {
    const newTricks = Math.max(0, Math.min(13, currentTricks + delta));
    setCurrentTricks(newTricks);
    setFormData({ ...formData, tricksTaken: newTricks });
  };

  // Bid generation
  const generateBids = () => {
    const levels = ['1', '2', '3', '4', '5', '6', '7'];
    const suits = ['♣', '♦', '♥', '♠', 'NT'];
    const bids = [];
    
    for (const level of levels) {
      for (const suit of suits) {
        bids.push(level + suit);
      }
    }
    
    return bids;
  };

  const specialBids = ['Pass', 'Double', 'Redouble'];
  const allBids = generateBids();
  const cards = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

  const handleSave = () => {
    if (!editingBoard) return;
    createOrUpdateMutation.mutate({
      ...formData,
      boardNumber: editingBoard,
    });
  };

  const cancelEditing = () => {
    setEditingBoard(null);
    setFormData({});
    setCurrentBidding([]);
    setCurrentTricks(7);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Game Header */}
      <div className="mb-6">
        <Link href="/live-games">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Live Games
          </Button>
        </Link>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold">{game.title}</h1>
              <Badge variant={game.status === "completed" ? "default" : "secondary"}>
                {game.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(game.gameDate), "PPP")}</span>
              </div>

              {game.clubName && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{game.clubName}</span>
                </div>
              )}

              {game.partnerName && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Partner: {game.partnerName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {boardNumbers.map((boardNumber) => {
          const hand = hands.find(h => h.boardNumber === boardNumber);
          const isEditing = editingBoard === boardNumber;

          return (
            <Card key={boardNumber} className={isEditing ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Board {boardNumber}</h3>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditingBoard(boardNumber)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Navigation hint */}
                    <div className="text-center text-sm text-muted-foreground">
                      Swipe for next board →
                    </div>

                    {/* BIDDING Section */}
                    <div>
                      <h4 className="font-semibold mb-2">BIDDING</h4>
                      
                      {/* Current bidding sequence display */}
                      <div className="bg-muted p-2 rounded mb-2 min-h-[60px]">
                        <div className="grid grid-cols-4 gap-1 text-center text-xs font-medium mb-1">
                          <span>N</span><span>E</span><span>S</span><span>W</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-center text-sm">
                          {Array.from({ length: Math.max(4, currentBidding.length) }).map((_, i) => (
                            <div key={i} className="p-1 min-h-[24px] bg-background rounded text-xs">
                              {currentBidding[i] || '-'}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Compact Bid Pad */}
                      <div className="space-y-2">
                        {/* Numbered bids in compact grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {allBids.map((bid) => {
                            const level = bid[0];
                            const suit = bid.slice(1);
                            const isRed = suit === '♥' || suit === '♦';
                            return (
                              <Button
                                key={bid}
                                variant="outline"
                                size="sm"
                                className={`h-8 text-xs p-1 ${isRed ? 'text-red-600' : ''}`}
                                onClick={() => addBid(bid)}
                              >
                                {level}{suit}
                              </Button>
                            );
                          })}
                        </div>

                        {/* Special bids */}
                        <div className="grid grid-cols-3 gap-1">
                          {specialBids.map((bid) => (
                            <Button
                              key={bid}
                              variant="outline"
                              size="sm"
                              className={`h-8 text-xs ${bid === 'Double' || bid === 'Redouble' ? 'text-red-600' : ''}`}
                              onClick={() => addBid(bid)}
                            >
                              {bid}
                            </Button>
                          ))}
                        </div>

                        {/* Bidding controls */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={clearBidding}>
                            Clear
                          </Button>
                          <Button variant="outline" size="sm" onClick={undoBid}>
                            Undo
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* PLAY Section */}
                    <div>
                      <h4 className="font-semibold mb-2">PLAY (Optional)</h4>
                      
                      {/* Opening Lead */}
                      <div className="mb-3">
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Lead:</label>
                        <div className="grid grid-cols-4 gap-1 mb-2">
                          {['♠', '♥', '♦', '♣'].map((suit) => (
                            <Button
                              key={suit}
                              variant="outline"
                              size="sm"
                              className={`h-8 text-sm ${suit === '♥' || suit === '♦' ? 'text-red-600' : ''}`}
                              onClick={() => setFormData({ ...formData, openingLead: suit })}
                            >
                              {suit}
                            </Button>
                          ))}
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {cards.map((card) => (
                            <Button
                              key={card}
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                const suit = formData.openingLead || '♠';
                                setFormData({ ...formData, openingLead: suit + card });
                              }}
                            >
                              {card}
                            </Button>
                          ))}
                        </div>
                        {formData.openingLead && (
                          <div className="mt-1 text-sm">
                            Selected: <span className="font-medium">{formData.openingLead}</span>
                          </div>
                        )}
                      </div>

                      {/* Tricks taken */}
                      <div className="mb-3">
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Tricks:</label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustTricks(-1)}
                            disabled={currentTricks <= 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{currentTricks}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustTricks(1)}
                            disabled={currentTricks >= 13}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">MP</label>
                          <Input
                            className="h-8"
                            value={formData.scoreMp || ""}
                            onChange={(e) => setFormData({ ...formData, scoreMp: e.target.value })}
                            placeholder="75%"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">IMP</label>
                          <Input
                            className="h-8"
                            value={formData.scoreImp || ""}
                            onChange={(e) => setFormData({ ...formData, scoreImp: e.target.value })}
                            placeholder="+2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Notes:</label>
                      <Textarea
                        className="h-16 resize-none"
                        value={formData.notes || ""}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Add notes..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={createOrUpdateMutation.isPending}
                      >
                        <Save className="mr-1 h-3 w-3" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={createOrUpdateMutation.isPending}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {hand ? (
                      <>
                        {/* Bidding sequence display */}
                        {hand.biddingSequence && hand.biddingSequence.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Bidding:</div>
                            <div className="bg-muted p-2 rounded">
                              <div className="grid grid-cols-4 gap-1 text-center text-xs font-medium mb-1">
                                <span>N</span><span>E</span><span>S</span><span>W</span>
                              </div>
                              <div className="grid grid-cols-4 gap-1 text-center text-xs">
                                {Array.from({ length: Math.max(4, hand.biddingSequence.length) }).map((_, i) => (
                                  <div key={i} className="p-1 min-h-[20px] bg-background rounded">
                                    {hand.biddingSequence![i] || '-'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Opening lead */}
                        {hand.openingLead && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Lead:</span>
                            <span className={hand.openingLead.includes('♥') || hand.openingLead.includes('♦') ? 'text-red-600' : ''}>
                              {hand.openingLead}
                            </span>
                          </div>
                        )}

                        {/* Basic info */}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dealer:</span>
                          <span>{hand.dealer || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vul:</span>
                          <span>{hand.vulnerability || "-"}</span>
                        </div>

                        {/* Play results */}
                        {hand.tricksTaken !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tricks:</span>
                            <span>{hand.tricksTaken}</span>
                          </div>
                        )}
                        
                        {/* Scores */}
                        <div className="flex gap-4">
                          {hand.scoreMp && (
                            <div className="flex justify-between flex-1">
                              <span className="text-muted-foreground">MP:</span>
                              <span>{hand.scoreMp}</span>
                            </div>
                          )}
                          {hand.scoreImp && (
                            <div className="flex justify-between flex-1">
                              <span className="text-muted-foreground">IMP:</span>
                              <span>{hand.scoreImp}</span>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {hand.notes && (
                          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                            {hand.notes}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No data yet
                      </p>
                    )}
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