import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { calculateBiddingAccuracy } from "@/lib/bridge-utils";
import type { Hand } from "@shared/schema";

interface BiddingPracticeProps {
  hand: Hand;
  userId: string;
}

const BIDDING_OPTIONS = [
  "Pass", "1♣", "1♦", "1♥", "1♠", "1NT",
  "2♣", "2♦", "2♥", "2♠", "2NT",
  "3♣", "3♦", "3♥", "3♠", "3NT",
  "4♣", "4♦", "4♥", "4♠", "4NT",
  "5♣", "5♦", "5♥", "5♠", "5NT",
  "6♣", "6♦", "6♥", "6♠", "6NT",
  "7♣", "7♦", "7♥", "7♠", "7NT",
  "Double", "Redouble"
];

export default function BiddingPractice({ hand, userId }: BiddingPracticeProps) {
  const [userBidding, setUserBidding] = useState<string[]>([]);
  const [currentBidder, setCurrentBidder] = useState(0); // 0=West, 1=North, 2=East, 3=South
  const [isComplete, setIsComplete] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  const queryClient = useQueryClient();

  const saveBiddingMutation = useMutation({
    mutationFn: async (biddingData: {
      bidding: string[];
      accuracy: number;
    }) => {
      const response = await apiRequest(`/api/hands/${hand.id}/bidding`, {
        method: "POST",
        body: JSON.stringify({
          userId,
          bidding: biddingData.bidding,
          accuracy: biddingData.accuracy,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hands", hand.id, "bidding", userId] });
    },
  });

  const handleBid = (bid: string) => {
    const newBidding = [...userBidding, bid];
    setUserBidding(newBidding);
    
    // Check if auction should end (three consecutive passes after a bid)
    if (shouldEndAuction(newBidding)) {
      const calculatedAccuracy = calculateBiddingAccuracy(newBidding, hand.actualBidding);
      setAccuracy(calculatedAccuracy);
      setIsComplete(true);
      
      saveBiddingMutation.mutate({
        bidding: newBidding,
        accuracy: calculatedAccuracy,
      });
    } else {
      setCurrentBidder((currentBidder + 1) % 4);
    }
  };

  const shouldEndAuction = (bidding: string[]): boolean => {
    if (bidding.length < 4) return false;
    
    // Check for three consecutive passes
    const lastThree = bidding.slice(-3);
    if (lastThree.every(bid => bid === "Pass") && bidding.length > 3) {
      return true;
    }
    
    // Check for very long auctions (safety check)
    return bidding.length > 20;
  };

  const resetPractice = () => {
    setUserBidding([]);
    setCurrentBidder(0);
    setIsComplete(false);
    setAccuracy(null);
  };

  const positions = ["West", "North", "East", "South"];
  const currentPosition = positions[currentBidder];

  // Group bidding into rounds for display
  const biddingRounds = [];
  for (let i = 0; i < userBidding.length; i += 4) {
    biddingRounds.push(userBidding.slice(i, i + 4));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bidding Practice</span>
          <div className="flex items-center space-x-2">
            {!isComplete && (
              <Badge variant="outline">
                {currentPosition} to bid
              </Badge>
            )}
            {isComplete && accuracy !== null && (
              <Badge variant={accuracy >= 80 ? "default" : "secondary"}>
                {accuracy}% Match
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Bidding Table */}
        <div className="mb-6">
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
              {biddingRounds.map((round, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2">{round[0] || '-'}</td>
                  <td className="py-2">{round[1] || '-'}</td>
                  <td className="py-2">{round[2] || '-'}</td>
                  <td className="py-2">{round[3] || '-'}</td>
                </tr>
              ))}
              {/* Current incomplete round */}
              {userBidding.length % 4 !== 0 && (
                <tr className="border-b border-gray-200">
                  {Array.from({ length: 4 }, (_, i) => {
                    const bidIndex = Math.floor(userBidding.length / 4) * 4 + i;
                    const bid = userBidding[bidIndex];
                    const isCurrent = i === currentBidder && !isComplete;
                    
                    return (
                      <td key={i} className={`py-2 ${isCurrent ? 'bg-primary/10 font-semibold' : ''}`}>
                        {bid || (isCurrent ? '?' : '-')}
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bidding Controls */}
        {!isComplete ? (
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2">
              {BIDDING_OPTIONS.map((bid) => {
                const isDoubleAction = bid === "Double" || bid === "Redouble";
                return (
                  <Button
                    key={bid}
                    variant="outline"
                    size="sm"
                    onClick={() => handleBid(bid)}
                    className={`text-xs ${isDoubleAction ? 'text-red-600' : ''}`}
                  >
                    {bid}
                  </Button>
                );
              })}
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-text-secondary">
                Current bidder: <strong>{currentPosition}</strong>
              </p>
              <Button variant="ghost" onClick={resetPractice}>
                Reset
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Practice Complete!</h4>
              <p className="text-sm">
                Your bidding sequence achieved a <strong>{accuracy}%</strong> match 
                with the actual auction.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={resetPractice}>
                Practice Again
              </Button>
              <Button variant="outline">
                Compare with Actual
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
