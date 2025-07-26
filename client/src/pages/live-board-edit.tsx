import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";

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

export default function LiveBoardEdit() {
  const { id, boardNumber } = useParams<{ id: string; boardNumber: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const boardNum = parseInt(boardNumber || "1");
  const gameId = parseInt(id || "0");
  
  const [formData, setFormData] = useState<Partial<LiveHand>>({});
  const [currentBidding, setCurrentBidding] = useState<string[]>([]);
  const [currentTricks, setCurrentTricks] = useState<number>(7);

  const { data: game, isLoading: gameLoading } = useQuery<LiveGame>({
    queryKey: [`/api/live-games/${id}`],
  });

  const { data: hands = [], isLoading: handsLoading } = useQuery<LiveHand[]>({
    queryKey: [`/api/live-games/${id}/hands`],
  });

  const { data: currentHand, isLoading: handLoading } = useQuery<LiveHand>({
    queryKey: [`/api/live-games/${id}/hands/${boardNum}`],
    enabled: !!boardNum,
  });

  useEffect(() => {
    if (currentHand) {
      setFormData(currentHand);
      setCurrentBidding(currentHand.biddingSequence || []);
      setCurrentTricks(currentHand.tricksTaken || 7);
    } else {
      // Calculate default dealer and vulnerability for this board number
      const dealers = ['North', 'East', 'South', 'West'];
      const vulnerabilities = ['None', 'NS', 'EW', 'Both'];
      const defaultDealer = dealers[(boardNum - 1) % 4];
      const vulnIndex = Math.floor((boardNum - 1) / 4) % 4;
      const defaultVulnerability = vulnerabilities[vulnIndex];
      
      setFormData({ 
        boardNumber: boardNum,
        dealer: defaultDealer,
        vulnerability: defaultVulnerability
      });
      setCurrentBidding([]);
      setCurrentTricks(7);
    }
  }, [currentHand, boardNum]);

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: Partial<LiveHand>) => {
      return apiRequest(`/api/live-games/${id}/hands`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/live-games/${id}/hands`] });
      queryClient.invalidateQueries({ queryKey: [`/api/live-games/${id}/hands/${boardNum}`] });
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

  // Bid validation
  const isValidBid = (bid: string) => {
    if (currentBidding.length === 0) return true;
    
    const lastBid = currentBidding[currentBidding.length - 1];
    if (bid === 'Pass' || bid === 'Double' || bid === 'Redouble') return true;
    
    if (lastBid === 'Pass' || lastBid === 'Double' || lastBid === 'Redouble') return true;
    
    const lastNumberedBid = [...currentBidding].reverse().find(b => 
      b !== 'Pass' && b !== 'Double' && b !== 'Redouble'
    );
    
    if (!lastNumberedBid) return true;
    
    const bidValue = getBidValue(bid);
    const lastBidValue = getBidValue(lastNumberedBid);
    
    return bidValue > lastBidValue;
  };

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
    const saveData = {
      ...formData,
      boardNumber: boardNum,
      bidding: currentBidding,
    };
    
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

  const handleCancel = () => {
    setLocation(`/live-games/${id}`);
  };

  // Navigation helpers
  const navigateBoard = (newBoardNum: number) => {
    if (newBoardNum >= 1 && newBoardNum <= 24) {
      setLocation(`/live-games/${id}/board/${newBoardNum}`);
    }
  };

  const boardNumbers = Array.from({ length: 24 }, (_, i) => i + 1);

  if (gameLoading || handLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
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
      <div className="max-w-4xl mx-auto p-4">
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link href={`/live-games/${id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <CardTitle className="text-lg">Board {boardNum}</CardTitle>
            </div>
            
            {/* Top Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateBoard(boardNum - 1)}
                disabled={boardNum <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Select
                value={boardNum.toString()}
                onValueChange={(value) => navigateBoard(parseInt(value))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {boardNumbers.map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateBoard(boardNum + 1)}
                disabled={boardNum >= 24}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {game.title} • {formData.dealer} dealer • {formData.vulnerability} vulnerable
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* BIDDING Section */}
          <div>
            <h3 className="font-semibold mb-3">BIDDING</h3>
            
            {/* Bid pad */}
            <div className="space-y-2 mb-4">
              {/* Level rows */}
              {['1', '2', '3', '4', '5', '6', '7'].map((level) => (
                <div key={level} className="grid grid-cols-5 gap-1">
                  {['♣', '♦', '♥', '♠', 'NT'].map((suit) => {
                    const bid = level + suit;
                    const isValid = isValidBid(bid);
                    const isRedSuit = suit === '♥' || suit === '♦';
                    
                    return (
                      <Button
                        key={bid}
                        variant="outline"
                        size="sm"
                        className={`h-8 text-xs ${
                          isRedSuit ? 'text-red-600' : ''
                        } ${!isValid ? 'opacity-30 cursor-not-allowed' : ''}`}
                        onClick={() => isValid && addBid(bid)}
                        disabled={!isValid}
                      >
                        {level}{suit}
                      </Button>
                    );
                  })}
                </div>
              ))}

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

            {/* Current bidding sequence display */}
            <div className="bg-muted p-3 rounded">
              <div className="grid grid-cols-4 gap-1 text-center text-xs font-medium mb-2">
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
            <h3 className="font-semibold mb-3">PLAY (Optional)</h3>
            
            {/* Lead and Tricks on same line */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              {/* Opening Lead */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Lead:</label>
                <div className="grid grid-cols-2 gap-1">
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
                          const currentSuit = formData.openingLead ? formData.openingLead.slice(-1) : '';
                          if (currentSuit) {
                            setFormData({ ...formData, openingLead: card + currentSuit });
                          } else {
                            setFormData({ ...formData, openingLead: card });
                          }
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
                            (formData.openingLead.length >= 2 ? formData.openingLead.slice(0, -1) : '') : 
                            '';
                          if (currentCard) {
                            setFormData({ ...formData, openingLead: currentCard + suit });
                          } else {
                            setFormData({ ...formData, openingLead: suit });
                          }
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
              <div>
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
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Notes:</label>
            <Textarea
              className="min-h-[60px]"
              placeholder="Add notes about this board..."
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={createOrUpdateMutation.isPending}>
                {createOrUpdateMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
            
            {/* Bottom Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateBoard(boardNum - 1)}
                disabled={boardNum <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Select
                value={boardNum.toString()}
                onValueChange={(value) => navigateBoard(parseInt(value))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {boardNumbers.map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateBoard(boardNum + 1)}
                disabled={boardNum >= 24}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}