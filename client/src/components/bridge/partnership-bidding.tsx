import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Edit, Save, X, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { formatBid } from "@/lib/bridge-utils";
import type { Hand, User, PartnershipBidding } from "@shared/schema";

interface PartnershipBiddingProps {
  hand: Hand;
}

const BIDDING_LAYOUT = {
  clubs: ["1♣", "2♣", "3♣", "4♣", "5♣", "6♣", "7♣"],
  diamonds: ["1♦", "2♦", "3♦", "4♦", "5♦", "6♦", "7♦"],
  hearts: ["1♥", "2♥", "3♥", "4♥", "5♥", "6♥", "7♥"],
  spades: ["1♠", "2♠", "3♠", "4♠", "5♠", "6♠", "7♠"],
  notrump: ["1NT", "2NT", "3NT", "4NT", "5NT", "6NT", "7NT"],
  actions: ["Pass", "Double", "Redouble"]
};

// Check if a bid is valid given the current bidding sequence
const isValidBid = (bid: string, currentBidding: string[], currentBidderIndex: number) => {
  if (bid === "Pass") return true;
  
  const lastBid = currentBidding[currentBidding.length - 1];
  
  if (bid === "Double") {
    if (currentBidding.length === 0) return false;
    if (!lastBid || lastBid === "Pass" || lastBid === "Double" || lastBid === "Redouble") return false;
    
    let lastActualBidIndex = -1;
    for (let i = currentBidding.length - 1; i >= 0; i--) {
      if (currentBidding[i] !== "Pass" && currentBidding[i] !== "Double" && currentBidding[i] !== "Redouble") {
        lastActualBidIndex = i;
        break;
      }
    }
    
    if (lastActualBidIndex === -1) return false;
    
    const lastBidderIndex = lastActualBidIndex % 4;
    const isOpponentBid = (currentBidderIndex + lastBidderIndex) % 2 === 1;
    
    return isOpponentBid;
  }
  
  if (bid === "Redouble") {
    if (lastBid !== "Double") return false;
    
    let doubleIndex = -1;
    for (let i = currentBidding.length - 1; i >= 0; i--) {
      if (currentBidding[i] === "Double") {
        doubleIndex = i;
        break;
      }
    }
    
    if (doubleIndex === -1) return false;
    
    const doubleBidderIndex = doubleIndex % 4;
    const isOpponentDouble = (currentBidderIndex + doubleBidderIndex) % 2 === 1;
    
    return isOpponentDouble;
  }
  
  // For regular bids, must be higher than the last valid bid
  const lastValidBid = currentBidding.slice().reverse().find(b => 
    b !== "Pass" && b !== "Double" && b !== "Redouble"
  );
  
  if (!lastValidBid) return true;
  
  const getBidValue = (bid: string) => {
    const level = parseInt(bid[0]);
    let suit = 0;
    if (bid.includes("♣")) suit = 1;
    else if (bid.includes("♦")) suit = 2;
    else if (bid.includes("♥")) suit = 3;
    else if (bid.includes("♠")) suit = 4;
    else if (bid.includes("NT")) suit = 5;
    
    return level * 5 + suit;
  };
  
  return getBidValue(bid) > getBidValue(lastValidBid);
};

export default function PartnershipBidding({ hand }: PartnershipBiddingProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [newBidding, setNewBidding] = useState<string[]>([]);
  const [currentBidder, setCurrentBidder] = useState(0);
  const [showPartnerDialog, setShowPartnerDialog] = useState(false);

  // Fetch user's partners
  const { data: partners = [] } = useQuery<User[]>({
    queryKey: ["/api/user/partners"],
    enabled: !!user,
  });

  // Fetch current user's game participation data
  const { data: gameData } = useQuery({
    queryKey: [`/api/games/${hand.gameId}/game-data`, user?.id],
    queryFn: async () => {
      const response = await apiRequest(`/api/games/${hand.gameId}/game-data?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!user && !!hand.gameId,
  });

  // Fetch partnership bidding for current user
  const { data: partnershipBidding, refetch: refetchBidding } = useQuery<PartnershipBidding | null>({
    queryKey: [`/api/hands/${hand.id}/partnership-bidding`, user?.id],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/hands/${hand.id}/partnership-bidding`);
        return response.json();
      } catch (error) {
        return null;
      }
    },
    enabled: !!user && !!hand.id,
  });

  // Check for conflicts when partner changes
  const checkConflictsMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const response = await apiRequest(
        `/api/games/${hand.gameId}/partnership-conflicts?partnerId=${partnerId}`
      );
      return response.json();
    },
  });

  // Create partnership bidding
  const createBiddingMutation = useMutation({
    mutationFn: async (data: { partnerId: string; biddingSequence: string[] }) => {
      const response = await apiRequest(`/api/hands/${hand.id}/partnership-bidding`, {
        method: "POST",
        body: JSON.stringify({
          ...data,
          gameId: hand.gameId,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      refetchBidding();
      queryClient.invalidateQueries({ queryKey: [`/api/hands/${hand.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${hand.gameId}/hands`] });
      setIsEditing(false);
      setNewBidding([]);
      setCurrentBidder(0);
    },
  });

  // Update partnership bidding
  const updateBiddingMutation = useMutation({
    mutationFn: async (data: { id: number; biddingSequence: string[] }) => {
      const response = await apiRequest(`/api/partnership-bidding/${data.id}`, {
        method: "PUT",
        body: JSON.stringify({ biddingSequence: data.biddingSequence }),
      });
      return response.json();
    },
    onSuccess: () => {
      refetchBidding();
      queryClient.invalidateQueries({ queryKey: [`/api/hands/${hand.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${hand.gameId}/hands`] });
      setIsEditing(false);
      setNewBidding([]);
      setCurrentBidder(0);
    },
  });

  // Delete partnership bidding
  const deleteBiddingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/hands/${hand.id}/partnership-bidding`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      refetchBidding();
      queryClient.invalidateQueries({ queryKey: [`/api/hands/${hand.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${hand.gameId}/hands`] });
      setIsEditing(false);
      setNewBidding([]);
      setCurrentBidder(0);
    },
  });

  // Initialize editing state
  useEffect(() => {
    if (isEditing && partnershipBidding) {
      setNewBidding(partnershipBidding.biddingSequence || []);
      setCurrentBidder(partnershipBidding.biddingSequence?.length || 0);
    }
  }, [isEditing, partnershipBidding]);

  const handleBid = (bid: string) => {
    if (!isValidBid(bid, newBidding, currentBidder)) {
      return;
    }
    
    const updatedBidding = [...newBidding, bid];
    setNewBidding(updatedBidding);
    setCurrentBidder((currentBidder + 1) % 4);
  };

  const handleSave = () => {
    // Use current game partner if available, otherwise use selected partner
    const partnerToUse = currentPartner?.id || selectedPartner;
    
    if (!partnerToUse && !partnershipBidding) {
      setShowPartnerDialog(true);
      return;
    }

    if (partnershipBidding) {
      updateBiddingMutation.mutate({
        id: partnershipBidding.id,
        biddingSequence: newBidding,
      });
    } else {
      createBiddingMutation.mutate({
        partnerId: partnerToUse,
        biddingSequence: newBidding,
      });
    }
  };

  const handleStartEditing = () => {
    // If user has a partner for this game, auto-use them
    if (currentPartner?.id) {
      setSelectedPartner(currentPartner.id);
    } else if (!partnershipBidding && partners.length === 0) {
      // No partners and no existing bidding - need to add partners first
      return;
    } else if (!partnershipBidding && partners.length === 1) {
      // Only one partner, auto-select them
      setSelectedPartner(partners[0].id);
    }
    
    setIsEditing(true);
    setNewBidding(partnershipBidding?.biddingSequence || []);
    setCurrentBidder(partnershipBidding?.biddingSequence?.length || 0);
  };

  const handlePartnerSelect = async (partnerId: string) => {
    setSelectedPartner(partnerId);
    
    // Check for conflicts
    try {
      const conflicts = await checkConflictsMutation.mutateAsync(partnerId);
      if (conflicts.hasConflicts) {
        // Show warning about conflicts but allow user to proceed
        console.warn("Partnership bidding conflicts detected:", conflicts.conflictingHands);
      }
    } catch (error) {
      console.error("Error checking conflicts:", error);
    }
    
    setShowPartnerDialog(false);
  };

  // Check if user played this game
  const userPlayedGame = gameData?.isPlaying || false;
  const currentPartner = gameData?.partner;

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Partnership Bidding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary">Please log in to access partnership bidding.</p>
        </CardContent>
      </Card>
    );
  }

  if (!userPlayedGame) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Partnership Bidding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary text-sm">
            Only players who participated in this game can enter bidding sequences.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasBidding = partnershipBidding && partnershipBidding.biddingSequence?.length > 0;
  const positions = ["West", "North", "East", "South"];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Partnership Bidding
          </CardTitle>
          {!hasBidding && !isEditing && (
            <Button onClick={handleStartEditing} size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Add Bidding
            </Button>
          )}
          {hasBidding && !isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleStartEditing} size="sm" variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button 
                onClick={() => deleteBiddingMutation.mutate()} 
                size="sm" 
                variant="destructive"
              >
                <X className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Show current partner */}
        {partnershipBidding && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-text-secondary">
              Partnership with: <span className="font-medium">{currentPartner?.displayName || "Unknown"}</span>
            </p>
          </div>
        )}

        {/* Display existing bidding */}
        {hasBidding && !isEditing && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    {positions.map((pos) => (
                      <th key={pos} className="text-left py-2">{pos}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const biddingRounds = [];
                    const bidding = partnershipBidding.biddingSequence || [];
                    
                    for (let i = 0; i < bidding.length; i += 4) {
                      const round = bidding.slice(i, i + 4);
                      biddingRounds.push(round);
                    }

                    return biddingRounds.map((round, roundIndex) => (
                      <tr key={roundIndex} className="border-b border-gray-100">
                        {positions.map((_, posIndex) => (
                          <td key={posIndex} className="py-1">
                            {round[posIndex] ? (
                              <span className={`${
                                round[posIndex] === "Double" || round[posIndex] === "Redouble" ||
                                round[posIndex].includes("♥") || round[posIndex].includes("♦")
                                  ? "text-red-600 font-semibold" 
                                  : ""
                              }`}>
                                {formatBid(round[posIndex])}
                              </span>
                            ) : "-"}
                          </td>
                        ))}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Editing interface */}
        {isEditing && (
          <div className="space-y-4">
            {/* Current bidder indicator */}
            <div className="text-sm text-text-secondary">
              Current bidder: <span className="font-medium">{positions[currentBidder % 4]}</span>
            </div>

            {/* Bidding buttons - compact grid layout */}
            <div className="space-y-2">
              {Object.entries(BIDDING_LAYOUT).map(([suit, bids]) => (
                <div key={suit} className="grid grid-cols-7 gap-1">
                  {bids.map((bid) => {
                    const isValid = isValidBid(bid, newBidding, currentBidder);
                    const isRed = suit === "hearts" || suit === "diamonds" || 
                                  (suit === "actions" && (bid === "Double" || bid === "Redouble"));
                    
                    return (
                      <Button
                        key={bid}
                        onClick={() => handleBid(bid)}
                        disabled={!isValid}
                        variant="outline"
                        size="sm"
                        className={`text-xs px-1 py-1 h-8 min-w-0 ${
                          isRed ? "text-red-600" : ""
                        } ${!isValid ? "opacity-50" : ""}`}
                      >
                        {formatBid(bid)}
                      </Button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Current bidding display */}
            {newBidding.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      {positions.map((pos) => (
                        <th key={pos} className="text-left py-2">{pos}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const biddingRounds = [];
                      for (let i = 0; i < newBidding.length; i += 4) {
                        const round = newBidding.slice(i, i + 4);
                        biddingRounds.push(round);
                      }

                      return biddingRounds.map((round, roundIndex) => (
                        <tr key={roundIndex} className="border-b border-gray-100">
                          {positions.map((_, posIndex) => (
                            <td key={posIndex} className="py-1">
                              {round[posIndex] ? (
                                <span className={`${
                                  round[posIndex] === "Double" || round[posIndex] === "Redouble" ||
                                  round[posIndex].includes("♥") || round[posIndex].includes("♦")
                                    ? "text-red-600 font-semibold" 
                                    : ""
                                }`}>
                                  {formatBid(round[posIndex])}
                                </span>
                              ) : "-"}
                            </td>
                          ))}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between pt-4">
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setNewBidding(partnershipBidding?.biddingSequence || []);
                  setCurrentBidder(partnershipBidding?.biddingSequence?.length || 0);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Bidding
              </Button>
            </div>
          </div>
        )}

        {/* No bidding state */}
        {!hasBidding && !isEditing && (
          <div className="text-center py-8 text-text-secondary">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="mb-2">No partnership bidding recorded</p>
            <p className="text-sm">Add your partnership's bidding sequence to track your agreements</p>
          </div>
        )}

        {/* Partner selection dialog */}
        <Dialog open={showPartnerDialog} onOpenChange={setShowPartnerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Your Partner</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-text-secondary mb-4">
                Choose your partner for this bidding sequence:
              </p>
              {partners.length > 0 ? (
                <div className="space-y-2">
                  {partners.map((partner) => (
                    <Button
                      key={partner.id}
                      onClick={() => handlePartnerSelect(partner.id)}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      {partner.displayName}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-text-secondary mb-3">
                    You haven't added any partners yet.
                  </p>
                  <Button onClick={() => setShowPartnerDialog(false)}>
                    Add Partners First
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}