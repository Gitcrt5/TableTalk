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
    
    // Calculate default dealer and vulnerability for this board number
    const dealers = ['North', 'East', 'South', 'West'];
    const vulnerabilities = ['None', 'NS', 'EW', 'Both'];
    const defaultDealer = dealers[(boardNumber - 1) % 4];
    const vulnIndex = Math.floor((boardNumber - 1) / 4) % 4;
    const defaultVulnerability = vulnerabilities[vulnIndex];
    
    setFormData(existingHand || { 
      boardNumber,
      dealer: defaultDealer,
      vulnerability: defaultVulnerability
    });
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

  // Bid validation - determine if a bid is valid based on current sequence
  const isValidBid = (bid: string) => {
    if (currentBidding.length === 0) return true;
    
    const lastBid = currentBidding[currentBidding.length - 1];
    if (bid === 'Pass' || bid === 'Double' || bid === 'Redouble') return true;
    
    // If last bid was Pass, Double, or Redouble, any bid is valid
    if (lastBid === 'Pass' || lastBid === 'Double' || lastBid === 'Redouble') return true;
    
    // For numbered bids, must be higher than the last numbered bid
    const lastNumberedBid = [...currentBidding].reverse().find(b => 
      b !== 'Pass' && b !== 'Double' && b !== 'Redouble'
    );
    
    if (!lastNumberedBid) return true;
    
    const bidValue = getBidValue(bid);
    const lastBidValue = getBidValue(lastNumberedBid);
    
    return bidValue > lastBidValue;
  };

  // Helper to get numeric value of a bid for comparison
  const getBidValue = (bid: string): number => {
    const level = parseInt(bid[0]);
    const suit = bid.slice(1);
    const suitValues = { '♣': 0, '♦': 1, '♥': 2, '♠': 3, 'NT': 4 };
    return level * 5 + (suitValues[suit as keyof typeof suitValues] || 0);
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
  
  // Generate card and suit options for lead selection
  const cardValues = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = ['♠', '♥', '♦', '♣'];

  const handleSave = () => {
    if (!editingBoard) return;
    
    // Ensure required fields are present
    const saveData = {
      ...formData,
      boardNumber: editingBoard,
      bidding: currentBidding, // API expects 'bidding' not 'biddingSequence'
    };
    
    // Ensure we have required fields
    if (!saveData.dealer || !saveData.vulnerability) {
      toast({
        title: "Missing Information",
        description: "Dealer and vulnerability are required.",
        variant: "destructive",
      });
      return;
    }
    
    createOrUpdateMutation.mutate(saveData);
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
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Compact Game Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Link href="/live-games">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Badge 
            variant={game.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {game.status}
          </Badge>
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
                    {/* BIDDING Section */}
                    <div>
                      <h4 className="font-semibold mb-2">BIDDING</h4>
                      
                      {/* Compact Bid Pad */}
                      <div className="space-y-2">
                        {/* Numbered bids in compact grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {allBids.map((bid) => {
                            const level = bid[0];
                            const suit = bid.slice(1);
                            const isRed = suit === '♥' || suit === '♦';
                            const isValid = isValidBid(bid);
                            return (
                              <Button
                                key={bid}
                                variant="outline"
                                size="sm"
                                className={`h-8 text-xs p-1 ${isRed ? 'text-red-600' : ''} ${!isValid ? 'opacity-40 cursor-not-allowed' : ''}`}
                                onClick={() => isValid && addBid(bid)}
                                disabled={!isValid}
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

                      {/* Current bidding sequence display - moved below */}
                      <div className="bg-muted p-2 rounded mt-2 min-h-[60px]">
                        <div className="grid grid-cols-4 gap-1 text-center text-xs font-medium mb-1">
                          <span>N</span><span>E</span><span>S</span><span>W</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-center text-sm">
                          {Array.from({ length: Math.max(4, currentBidding.length) }).map((_, i) => {
                            const bid = currentBidding[i];
                            const isRedBid = bid && (bid.includes('♥') || bid.includes('♦'));
                            return (
                              <div key={i} className={`p-1 min-h-[24px] bg-background rounded text-xs ${isRedBid ? 'text-red-600' : ''}`}>
                                {bid || '-'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* PLAY Section */}
                    <div>
                      <h4 className="font-semibold mb-2">PLAY (Optional)</h4>
                      
                      {/* Opening Lead */}
                      <div className="mb-3">
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Lead:</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Select
                              value={formData.openingLead ? 
                                (formData.openingLead.length >= 2 ? formData.openingLead.slice(0, -1) : "none") : 
                                "none"
                              }
                              onValueChange={(card) => {
                                if (card === "none") {
                                  setFormData({ ...formData, openingLead: undefined });
                                } else {
                                  const currentSuit = formData.openingLead ? formData.openingLead.slice(-1) : '♠';
                                  setFormData({ ...formData, openingLead: card + currentSuit });
                                }
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Card" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">-</SelectItem>
                                {cardValues.map((card) => (
                                  <SelectItem key={card} value={card}>
                                    {card}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Select
                              value={formData.openingLead ? formData.openingLead.slice(-1) : "none"}
                              onValueChange={(suit) => {
                                if (suit === "none") {
                                  setFormData({ ...formData, openingLead: undefined });
                                } else {
                                  const currentCard = formData.openingLead ? 
                                    (formData.openingLead.length >= 2 ? formData.openingLead.slice(0, -1) : 'A') : 
                                    'A';
                                  setFormData({ ...formData, openingLead: currentCard + suit });
                                }
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Suit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">-</SelectItem>
                                {suits.map((suit) => (
                                  <SelectItem key={suit} value={suit}>
                                    <span className={suit === '♥' || suit === '♦' ? 'text-red-600' : ''}>
                                      {suit}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
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