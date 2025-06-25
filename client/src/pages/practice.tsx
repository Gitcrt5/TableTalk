import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import HandDisplay from "@/components/bridge/hand-display";
import BiddingPractice from "@/components/bridge/bidding-practice";
import { Shuffle, TrendingUp, Target, Clock } from "lucide-react";
import type { Hand } from "@shared/schema";

export default function Practice() {
  const [selectedVulnerability, setSelectedVulnerability] = useState<string>("all");
  const [selectedDealer, setSelectedDealer] = useState<string>("all");
  const [currentHandIndex, setCurrentHandIndex] = useState(0);

  const { data: hands, isLoading } = useQuery<Hand[]>({
    queryKey: [
      "/api/hands",
      selectedVulnerability !== "all" ? selectedVulnerability : undefined,
      selectedDealer !== "all" ? selectedDealer : undefined
    ].filter(Boolean),
  });

  const currentHand = hands?.[currentHandIndex];

  const getRandomHand = () => {
    if (hands && hands.length > 0) {
      const randomIndex = Math.floor(Math.random() * hands.length);
      setCurrentHandIndex(randomIndex);
    }
  };

  const getNextHand = () => {
    if (hands && hands.length > 0) {
      setCurrentHandIndex((prev) => (prev + 1) % hands.length);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Bidding Practice</h1>
        <p className="text-text-secondary">
          Practice your bidding skills with real game hands
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Practice Controls */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Practice Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={getRandomHand} 
                className="w-full"
                disabled={!hands || hands.length === 0}
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Random Hand
              </Button>
              
              <Button 
                variant="outline" 
                onClick={getNextHand}
                className="w-full"
                disabled={!hands || hands.length === 0}
              >
                <Target className="mr-2 h-4 w-4" />
                Next Hand
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vulnerability</label>
                <Select value={selectedVulnerability} onValueChange={setSelectedVulnerability}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vulnerabilities</SelectItem>
                    <SelectItem value="None">Love All</SelectItem>
                    <SelectItem value="NS">N-S Vulnerable</SelectItem>
                    <SelectItem value="EW">E-W Vulnerable</SelectItem>
                    <SelectItem value="Both">Game All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Dealer</label>
                <Select value={selectedDealer} onValueChange={setSelectedDealer}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dealers</SelectItem>
                    <SelectItem value="N">North</SelectItem>
                    <SelectItem value="E">East</SelectItem>
                    <SelectItem value="S">South</SelectItem>
                    <SelectItem value="W">West</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Practice Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Hands Available:</span>
                <Badge variant="outline">{hands?.length || 0}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Current Hand:</span>
                <Badge>{currentHandIndex + 1} of {hands?.length || 0}</Badge>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Your Progress</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Today:</span>
                    <span className="font-medium">12 hands</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Avg. Accuracy:</span>
                    <span className="font-medium">87%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Practice Area */}
        <main className="lg:col-span-3">
          {isLoading ? (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-32" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-64" />
                </CardContent>
              </Card>
            </div>
          ) : !currentHand ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-text-secondary">
                  <Shuffle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No hands available</h3>
                  <p>
                    Try adjusting your filters or upload some PBN files to get started with practice.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Current Hand Header */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">
                        Board {currentHand.boardNumber} - {currentHand.vulnerability} Vulnerable
                      </CardTitle>
                      <p className="text-text-secondary">
                        Dealer: {currentHand.dealer} • Practice your bidding sequence
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-text-secondary" />
                      <span className="text-sm text-text-secondary">Practice Session</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Hand Display */}
              <Card>
                <CardContent className="p-6">
                  <HandDisplay hand={currentHand} />
                </CardContent>
              </Card>

              {/* Bidding Practice */}
              <BiddingPractice 
                hand={currentHand} 
                userId="current-user" // In real app, get from auth
              />

              {/* Practice Navigation */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentHandIndex(Math.max(0, currentHandIndex - 1))}
                      disabled={currentHandIndex === 0}
                    >
                      Previous Hand
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={getRandomHand}>
                        <Shuffle className="mr-2 h-4 w-4" />
                        Random
                      </Button>
                      <Button onClick={getNextHand}>
                        Next Hand
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
