import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import HandDisplay from "@/components/bridge/hand-display";
import BiddingTable from "@/components/bridge/bidding-table";
import CommentsSection from "@/components/comments/comments-section";
import { ArrowLeft, Edit, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Link, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { formatContract } from "@/lib/bridge-utils";
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
const isValidBid = (bid: string, currentBidding: string[], currentBidderIndex: number) => {
  // Pass is always allowed
  if (bid === "Pass") return true;
  
  const lastBid = currentBidding[currentBidding.length - 1];
  
  // Double validation: can only double opponent's bid, not partner's or your own
  if (bid === "Double") {
    // Must have at least one bid in the sequence
    if (currentBidding.length === 0) return false;
    
    // Cannot double Pass, Double, or Redouble
    if (!lastBid || lastBid === "Pass" || lastBid === "Double" || lastBid === "Redouble") return false;
    
    // Find the last actual bid (not Pass/Double/Redouble)
    let lastActualBidIndex = -1;
    for (let i = currentBidding.length - 1; i >= 0; i--) {
      if (currentBidding[i] !== "Pass" && currentBidding[i] !== "Double" && currentBidding[i] !== "Redouble") {
        lastActualBidIndex = i;
        break;
      }
    }
    
    if (lastActualBidIndex === -1) return false;
    
    // Check if the last actual bid was made by an opponent
    // In a 4-player game: positions 0,2 are partners and 1,3 are partners
    const lastBidderIndex = lastActualBidIndex % 4;
    const isOpponentBid = (currentBidderIndex + lastBidderIndex) % 2 === 1;
    
    return isOpponentBid;
  }
  
  // Redouble can only be used after opponent's Double
  if (bid === "Redouble") {
    // Must have a Double as the last bid
    if (lastBid !== "Double") return false;
    
    // Find who made the Double
    let doubleIndex = -1;
    for (let i = currentBidding.length - 1; i >= 0; i--) {
      if (currentBidding[i] === "Double") {
        doubleIndex = i;
        break;
      }
    }
    
    if (doubleIndex === -1) return false;
    
    // Check if the Double was made by an opponent
    const doubleBidderIndex = doubleIndex % 4;
    const isOpponentDouble = (currentBidderIndex + doubleBidderIndex) % 2 === 1;
    
    return isOpponentDouble;
  }
  
  // For suit/NT bids, must be higher than last valid bid
  const lastValidBid = getLastValidBid(currentBidding);
  if (!lastValidBid) return true; // First bid can be anything
  
  return getBidValue(bid) > getBidValue(lastValidBid);
};

// Get the appropriate color class for a bid
const getBidColor = (bid: string) => {
  if (bid.includes("♣") || bid.includes("♠")) return "text-black";
  if (bid.includes("♥")) return "text-red-600";
  if (bid.includes("♦")) return "text-orange-600";
  if (bid.includes("NT")) return "text-blue-700";
  return "text-gray-700"; // For Pass, Double, Redouble
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

  const { data: game } = useQuery({
    queryKey: [`/api/games/${hand?.gameId}`],
    enabled: !!hand?.gameId,
  });

  const updateBiddingMutation = useMutation({
    mutationFn: async (biddingData: {
      bidding: string[];
      finalContract?: string;
      declarer?: string;
      result?: string;
    }) => {
      const response = await apiRequest(`/api/hands/${handId}/bidding`, {
        method: "PUT",
        body: JSON.stringify(biddingData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hands/${handId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${hand?.gameId}/hands`] });
      setIsEditingBidding(false);
      setNewBidding([]);
      setCurrentBidder(0);
    },
  });

  const handleBid = (bid: string) => {
    // Only allow valid bids
    if (!isValidBid(bid, newBidding, currentBidder)) {
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
      
      // Check if the final bid was doubled or redoubled
      const finalBidIndex = newBidding.lastIndexOf(finalBid);
      
      // Look for Double or Redouble after the final bid
      let isDoubled = false;
      let isRedoubled = false;
      
      for (let i = finalBidIndex + 1; i < newBidding.length; i++) {
        if (newBidding[i] === "Double") {
          isDoubled = true;
          isRedoubled = false; // Reset redouble if we find a new double
        } else if (newBidding[i] === "Redouble") {
          isRedoubled = true;
        } else if (newBidding[i] !== "Pass") {
          // If we hit another bid, stop looking
          break;
        }
      }
      
      // Add X for doubled or XX for redoubled
      if (isRedoubled) {
        finalContract += "XX";
      } else if (isDoubled) {
        finalContract += "X";
      }
      
      // Find who made the final contract bid
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
    <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-2 md:py-4">
      {/* Header */}
      <div className="mb-3 md:mb-4">
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
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
              Board {hand.boardNumber}
            </h1>
            
            {/* Game Information */}
            {game && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-semibold text-text-primary">{game.title}</span>
                  {game.date && (
                    <span className="text-text-secondary">📅 {game.date}</span>
                  )}
                  {game.location && (
                    <span className="text-text-secondary">📍 {game.location}</span>
                  )}
                  {game.tournament && (
                    <span className="text-text-secondary">🏆 {game.tournament}</span>
                  )}
                  {game.round && (
                    <Badge variant="outline" className="text-xs">{game.round}</Badge>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-text-secondary">
              <Badge variant="outline" className="text-xs md:text-sm">Dealer: {hand.dealer}</Badge>
              <Badge variant="outline" className="text-xs md:text-sm">{hand.vulnerability}</Badge>
              {hand.finalContract && (
                <Badge className="text-xs md:text-sm">
                  Contract:{'\u00A0'}
                  {(() => {
                    const { contractPart, isRed } = formatContract(hand.finalContract);
                    return (
                      <>
                        <span className={isRed ? "text-red-600" : ""}>
                          {contractPart}
                        </span>
                        {hand.declarer && <>{'\u00A0'}by{'\u00A0'}{hand.declarer}</>}
                      </>
                    );
                  })()}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hand Display and Bidding Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
        {/* Hand Display - takes 2/3 of width on large screens */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-2 md:p-4">
              <HandDisplay hand={hand} />
            </CardContent>
          </Card>
        </div>

        {/* Bidding Section - takes 1/3 of width on large screens, full width on smaller screens */}
        <div className="lg:col-span-1">
          <Card>
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
            <CardContent className="p-3 md:p-6">
          {hasBidding && !isEditingBidding ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm bridge-hand">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2">West</th>
                      <th className="text-left py-2">North</th>
                      <th className="text-left py-2">East</th>
                      <th className="text-left py-2">South</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const biddingRounds = [];
                      if (hand.actualBidding && hand.actualBidding.length > 0) {
                        for (let i = 0; i < hand.actualBidding.length; i += 4) {
                          biddingRounds.push(hand.actualBidding.slice(i, i + 4));
                        }
                      }
                      
                      const formatBid = (bid: string) => {
                        if (!bid || bid === "Pass" || bid === "-") return bid;
                        
                        // Handle special bids that shouldn't be converted
                        if (bid === "Double" || bid === "Redouble") return bid;
                        
                        // Convert suit letters to symbols while preserving X/XX annotations
                        let formattedBid = bid.replace(/(\d)([SHDC])(X*)/g, (match, level, suit, doubleMarker) => {
                          const suitSymbol = suit === 'S' ? '♠' : suit === 'H' ? '♥' : suit === 'D' ? '♦' : suit === 'C' ? '♣' : suit;
                          return level + suitSymbol + doubleMarker;
                        });
                        
                        // Handle NT with X/XX
                        formattedBid = formattedBid.replace(/(\d)NT(X*)/g, '$1NT$2');
                        
                        return formattedBid;
                      };
                      
                      return biddingRounds.map((round, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className={`py-2 ${getBidColor(formatBid(round[0]) || '')}`}>
                            {formatBid(round[0]) || '-'}
                          </td>
                          <td className={`py-2 ${getBidColor(formatBid(round[1]) || '')}`}>
                            {formatBid(round[1]) || '-'}
                          </td>
                          <td className={`py-2 ${getBidColor(formatBid(round[2]) || '')}`}>
                            {formatBid(round[2]) || '-'}
                          </td>
                          <td className={`py-2 ${getBidColor(formatBid(round[3]) || '')}`}>
                            {formatBid(round[3]) || '-'}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              
              {hand.finalContract && (
                <Card className="bg-white">
                  <CardContent className="p-3">
                    <div className="text-sm text-text-secondary">Final Contract:</div>
                    <div className="font-semibold text-lg">
                      {(() => {
                        const { contractPart, isRed } = formatContract(hand.finalContract);
                        return (
                          <>
                            <span className={isRed ? "text-red-600" : ""}>
                              {contractPart}
                            </span>
                            {hand.declarer && <>{'\u00A0'}by{'\u00A0'}{hand.declarer}</>}
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : isEditingBidding ? (
            <div className="space-y-4 md:space-y-6">
              {/* Current Bidding Display */}
              {newBidding.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium mb-2 text-sm">Current Auction:</h4>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex flex-wrap gap-1">
                      {newBidding.map((bid, index) => (
                        <Badge key={index} variant="outline" className={`text-xs ${getBidColor(bid)}`}>
                          {positions[index % 4]}: <span className={getBidColor(bid)}>{bid}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bidding Controls */}
              <div>
                <div className="flex flex-col gap-2 mb-3">
                  <h4 className="font-medium text-sm">
                    Current bidder: <strong>{positions[currentBidder]}</strong>
                  </h4>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setIsEditingBidding(false);
                      setNewBidding([]);
                      setCurrentBidder(0);
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSaveBidding}
                      disabled={newBidding.length === 0}
                    >
                      Save Bidding
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {/* Clubs Row */}
                  <div className="grid grid-cols-7 gap-1">
                    {BIDDING_LAYOUT.clubs.map((bid) => {
                      const isDisabled = !isValidBid(bid, newBidding, currentBidder);
                      return (
                        <Button
                          key={bid}
                          variant="outline"
                          size="sm"
                          onClick={() => handleBid(bid)}
                          disabled={isDisabled}
                          className={`text-xs h-7 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} text-black`}
                        >
                          {bid}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Diamonds Row */}
                  <div className="grid grid-cols-7 gap-1">
                    {BIDDING_LAYOUT.diamonds.map((bid) => {
                      const isDisabled = !isValidBid(bid, newBidding, currentBidder);
                      return (
                        <Button
                          key={bid}
                          variant="outline"
                          size="sm"
                          onClick={() => handleBid(bid)}
                          disabled={isDisabled}
                          className={`text-xs h-7 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} text-orange-600`}
                        >
                          {bid}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Hearts Row */}
                  <div className="grid grid-cols-7 gap-1">
                    {BIDDING_LAYOUT.hearts.map((bid) => {
                      const isDisabled = !isValidBid(bid, newBidding, currentBidder);
                      return (
                        <Button
                          key={bid}
                          variant="outline"
                          size="sm"
                          onClick={() => handleBid(bid)}
                          disabled={isDisabled}
                          className={`text-xs h-7 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} text-red-600`}
                        >
                          {bid}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Spades Row */}
                  <div className="grid grid-cols-7 gap-1">
                    {BIDDING_LAYOUT.spades.map((bid) => {
                      const isDisabled = !isValidBid(bid, newBidding, currentBidder);
                      return (
                        <Button
                          key={bid}
                          variant="outline"
                          size="sm"
                          onClick={() => handleBid(bid)}
                          disabled={isDisabled}
                          className={`text-xs h-7 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} text-black`}
                        >
                          {bid}
                        </Button>
                      );
                    })}
                  </div>

                  {/* No Trump Row */}
                  <div className="grid grid-cols-7 gap-1">
                    {BIDDING_LAYOUT.notrump.map((bid) => {
                      const isDisabled = !isValidBid(bid, newBidding, currentBidder);
                      return (
                        <Button
                          key={bid}
                          variant="outline"
                          size="sm"
                          onClick={() => handleBid(bid)}
                          disabled={isDisabled}
                          className={`text-xs h-7 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} text-blue-700`}
                        >
                          {bid}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Pass, Double, Redouble Row */}
                  <div className="grid grid-cols-3 gap-2 max-w-xs md:max-w-md">
                    {BIDDING_LAYOUT.actions.map((bid) => {
                      const isDisabled = !isValidBid(bid, newBidding, currentBidder);
                      const isDoubleAction = bid === "Double" || bid === "Redouble";
                      return (
                        <Button
                          key={bid}
                          variant={bid === "Pass" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleBid(bid)}
                          disabled={isDisabled}
                          className={`text-xs h-7 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${isDoubleAction ? 'text-red-600' : ''}`}
                        >
                          {bid}
                        </Button>
                      );
                    })}
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
        </div>
      </div>

      {/* Comments Section */}
      <CommentsSection handId={hand.id} />
    </div>
  );
}