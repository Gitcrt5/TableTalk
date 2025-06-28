import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import HandDisplay from "@/components/bridge/hand-display";
import BiddingTable from "@/components/bridge/bidding-table";
import CommentsSection from "@/components/comments/comments-section";
import { ArrowLeft, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Hand } from "@shared/schema";

const BIDDING_LAYOUT = {
  clubs: ["1♣", "2♣", "3♣", "4♣", "5♣", "6♣", "7♣"],
  diamonds: ["1♦", "2♦", "3♦", "4♦", "5♦", "6♦", "7♦"],
  hearts: ["1♥", "2♥", "3♥", "4♥", "5♥", "6♥", "7♥"],
  spades: ["1♠", "2♠", "3♠", "4♠", "5♠", "6♠", "7♠"],
  notrump: ["1NT", "2NT", "3NT", "4NT", "5NT", "6NT", "7NT"],
  actions: ["Pass", "Double", "Redouble"]
};

// Get the last valid bid (not Pass, Double, or Redouble)
const getLastValidBid = (bidding: string[]) => {
  for (let i = bidding.length - 1; i >= 0; i--) {
    const bid = bidding[i];
    if (bid !== "Pass" && bid !== "Double" && bid !== "Redouble") {
      return bid;
    }
  }
  return null;
};

// Convert bid to numeric value for comparison
const getBidValue = (bid: string) => {
  if (bid === "Pass" || bid === "Double" || bid === "Redouble") return 0;
  
  const level = parseInt(bid[0]);
  let suit = 0;
  if (bid.includes("♣")) suit = 1;
  else if (bid.includes("♦")) suit = 2;
  else if (bid.includes("♥")) suit = 3;
  else if (bid.includes("♠")) suit = 4;
  else if (bid.includes("NT")) suit = 5;
  
  return level * 5 + suit;
};

// Check if a bid is valid given the current bidding sequence
const isValidBid = (bid: string, currentBidding: string[]) => {
  // Pass is always allowed
  if (bid === "Pass") return true;
  
  const lastBid = currentBidding[currentBidding.length - 1];
  
  // Double can only be used after opponent's bid (simplified - just check it's not after Double/Redouble)
  if (bid === "Double") return lastBid !== "Double" && lastBid !== "Redouble";
  
  // Redouble can only be used after Double
  if (bid === "Redouble") return lastBid === "Double";
  
  // For suit/NT bids, must be higher than last valid bid
  const lastValidBid = getLastValidBid(currentBidding);
  if (!lastValidBid) return true; // First bid can be anything
  
  return getBidValue(bid) > getBidValue(lastValidBid);
};

export default function HandDetail() {
  const { id } = useParams<{ id: string }>();
  const handId = parseInt(id!);
  const [isEditingBidding, setIsEditingBidding] = useState(false);
  const [newBidding, setNewBidding] = useState<string[]>([]);
  const [currentBidder, setCurrentBidder] = useState(0);

  const queryClient = useQueryClient();

  const { data: hand, isLoading: handLoading } = useQuery<Hand>({
    queryKey: [`/api/hands/${handId}`],
    enabled: !!handId,
  });
  


  const { data: gameHands } = useQuery<Hand[]>({
    queryKey: [`/api/games/${hand?.gameId}/hands`],
    enabled: !!hand?.gameId,
  });

  const updateBiddingMutation = useMutation({
    mutationFn: async (biddingData: {
      bidding: string[];
      finalContract?: string;
      declarer?: string;
      result?: string;
    }) => {
      const response = await apiRequest("PUT", `/api/hands/${handId}/bidding`, biddingData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hands/${handId}`] });
      setIsEditingBidding(false);
      setNewBidding([]);
      setCurrentBidder(0);
    },
  });

  const handleBid = (bid: string) => {
    // Only allow valid bids
    if (!isValidBid(bid, newBidding)) {
      return;
    }
    
    const updatedBidding = [...newBidding, bid];
    setNewBidding(updatedBidding);
    setCurrentBidder((currentBidder + 1) % 4);
  };

  const handleSaveBidding = () => {
    // Determine final contract and declarer from bidding
    const finalBid = newBidding.slice().reverse().find(bid => 
      bid !== "Pass" && bid !== "Double" && bid !== "Redouble"
    );
    
    let finalContract = "";
    let declarer = "";
    
    if (finalBid) {
      finalContract = finalBid;
      // Find who made the final contract bid
      const finalBidIndex = newBidding.lastIndexOf(finalBid);
      declarer = positions[finalBidIndex % 4];
    }
    
    updateBiddingMutation.mutate({
      bidding: newBidding,
      finalContract,
      declarer,
    });
  };

  const positions = ["West", "North", "East", "South"];



  if (handLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </div>
      </div>
    );
  }

  if (!hand) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Hand not found</h2>
            <p className="text-text-secondary mb-4">
              The requested hand could not be found.
            </p>
            <Link to="/">
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

  const hasBidding = hand.actualBidding && hand.actualBidding.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link to={`/games/${hand.gameId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Game
            </Button>
          </Link>
          
          {gameHands && gameHands.length > 1 && (
            <div className="flex items-center space-x-2">
              {(() => {
                const currentIndex = gameHands.findIndex(h => h.id === hand.id);
                const prevHand = currentIndex > 0 ? gameHands[currentIndex - 1] : null;
                const nextHand = currentIndex < gameHands.length - 1 ? gameHands[currentIndex + 1] : null;
                
                return (
                  <>
                    <Link to={prevHand ? `/hands/${prevHand.id}` : '#'}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={!prevHand}
                        className="flex items-center"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                    </Link>
                    
                    <span className="text-sm text-text-secondary px-2">
                      {currentIndex + 1} of {gameHands.length}
                    </span>
                    
                    <Link to={nextHand ? `/hands/${nextHand.id}` : '#'}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={!nextHand}
                        className="flex items-center"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Board {hand.boardNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-text-secondary">
              <Badge variant="outline">Dealer: {hand.dealer}</Badge>
              <Badge variant="outline">{hand.vulnerability}</Badge>
              {hand.finalContract && (
                <Badge>Contract: {hand.finalContract} by {hand.declarer}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hand Display */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <HandDisplay hand={hand} />
        </CardContent>
      </Card>

      {/* Bidding Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bidding</CardTitle>
            {!hasBidding && !isEditingBidding && (
              <Button onClick={() => setIsEditingBidding(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Add Bidding
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasBidding && !isEditingBidding ? (
            <BiddingTable
              title="Auction"
              bidding={hand.actualBidding}
              finalContract={hand.finalContract ?? undefined}
              declarer={hand.declarer ?? undefined}
            />
          ) : isEditingBidding ? (
            <div className="space-y-6">
              {/* Current Bidding Display */}
              {newBidding.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Current Auction:</h4>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="flex flex-wrap gap-2">
                      {newBidding.map((bid, index) => (
                        <Badge key={index} variant="outline">
                          {positions[index % 4]}: {bid}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bidding Controls */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">
                    Current bidder: <strong>{positions[currentBidder]}</strong>
                  </h4>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => {
                      setIsEditingBidding(false);
                      setNewBidding([]);
                      setCurrentBidder(0);
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveBidding}
                      disabled={newBidding.length === 0}
                    >
                      Save Bidding
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Clubs Row */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">♣ Clubs</div>
                    <div className="grid grid-cols-7 gap-2">
                      {BIDDING_LAYOUT.clubs.map((bid) => {
                      const isDisabled = !isValidBid(bid, newBidding);
                      return (
                        <Button
                          key={bid}
                          variant="outline"
                          size="sm"
                          onClick={() => handleBid(bid)}
                          disabled={isDisabled}
                          className={`text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {bid}
                        </Button>
                      );
                    })}
                    </div>
                  </div>

                  {/* Diamonds Row */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">♦ Diamonds</div>
                    <div className="grid grid-cols-7 gap-2">
                      {BIDDING_LAYOUT.diamonds.map((bid) => {
                        const isDisabled = !isValidBid(bid, newBidding);
                        return (
                          <Button
                            key={bid}
                            variant="outline"
                            size="sm"
                            onClick={() => handleBid(bid)}
                            disabled={isDisabled}
                            className={`text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {bid}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hearts Row */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">♥ Hearts</div>
                    <div className="grid grid-cols-7 gap-2">
                      {BIDDING_LAYOUT.hearts.map((bid) => {
                        const isDisabled = !isValidBid(bid, newBidding);
                        return (
                          <Button
                            key={bid}
                            variant="outline"
                            size="sm"
                            onClick={() => handleBid(bid)}
                            disabled={isDisabled}
                            className={`text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {bid}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Spades Row */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">♠ Spades</div>
                    <div className="grid grid-cols-7 gap-2">
                      {BIDDING_LAYOUT.spades.map((bid) => {
                        const isDisabled = !isValidBid(bid, newBidding);
                        return (
                          <Button
                            key={bid}
                            variant="outline"
                            size="sm"
                            onClick={() => handleBid(bid)}
                            disabled={isDisabled}
                            className={`text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {bid}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* No Trump Row */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">NT No Trump</div>
                    <div className="grid grid-cols-7 gap-2">
                      {BIDDING_LAYOUT.notrump.map((bid) => {
                        const isDisabled = !isValidBid(bid, newBidding);
                        return (
                          <Button
                            key={bid}
                            variant="outline"
                            size="sm"
                            onClick={() => handleBid(bid)}
                            disabled={isDisabled}
                            className={`text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {bid}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pass, Double, Redouble Row */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Actions</div>
                    <div className="grid grid-cols-3 gap-2 max-w-md">
                      {BIDDING_LAYOUT.actions.map((bid) => {
                        const isDisabled = !isValidBid(bid, newBidding);
                        return (
                          <Button
                            key={bid}
                            variant={bid === "Pass" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleBid(bid)}
                            disabled={isDisabled}
                            className={`text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {bid}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <p>No bidding recorded for this hand.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <CommentsSection handId={hand.id} />
    </div>
  );
}