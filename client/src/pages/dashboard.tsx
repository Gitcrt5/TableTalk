import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/layout/sidebar";
import HandDisplay from "@/components/bridge/hand-display";
import BiddingTable from "@/components/bridge/bidding-table";
import CommentsSection from "@/components/comments/comments-section";
import { Search, Eye, TrendingUp, MessageSquare, Upload } from "lucide-react";
import type { Game, Hand } from "@shared/schema";

export default function Dashboard() {
  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/users/current/stats"],
  });

  // Get the first game and its first hand for featured display
  const featuredGame = games?.[0];
  const { data: featuredHands } = useQuery<Hand[]>({
    queryKey: ["/api/games", featuredGame?.id, "hands"],
    enabled: !!featuredGame,
  });
  const featuredHand = featuredHands?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <Sidebar />
        </aside>

        <main className="lg:col-span-3">
          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search games, players, or hands..."
                    className="pl-10"
                  />
                </div>
                <Button>Search</Button>
              </div>
            </CardContent>
          </Card>

          {/* Featured Game Display */}
          {featuredGame && featuredHand && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">
                      Board {featuredHand.boardNumber} - {featuredHand.vulnerability} Vulnerable
                    </CardTitle>
                    <p className="text-text-secondary">{featuredGame.tournament}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon">
                      <i className="fas fa-bookmark" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <i className="fas fa-share" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <HandDisplay hand={featuredHand} />
                
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <BiddingTable
                    title="Actual Bidding"
                    bidding={featuredHand.actualBidding}
                    finalContract={featuredHand.finalContract}
                    declarer={featuredHand.declarer}
                    icon="gavel"
                  />
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold flex items-center space-x-2">
                        <i className="fas fa-user text-primary" />
                        <span>Your Bidding</span>
                      </h3>
                      <Button size="sm">Practice This Hand</Button>
                    </div>
                    <div className="text-center text-text-secondary py-8">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <p>Click "Practice This Hand" to enter your own bidding sequence and compare it with the actual auction.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          {featuredHand && <CommentsSection handId={featuredHand.id} />}
        </main>
      </div>

      {/* Recent Games Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Games</h2>
          <Button variant="link">
            View All Games <i className="fas fa-arrow-right ml-1" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gamesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            games?.slice(0, 3).map((game) => (
              <Card key={game.id} className="material-shadow hover:material-shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{game.title}</h3>
                      <p className="text-text-secondary text-sm">{game.tournament}</p>
                    </div>
                    <Badge variant="secondary" className="w-2 h-2 p-0" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Uploaded:</span>
                      <span className="font-mono">{new Date(game.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">By:</span>
                      <span className="font-mono">{game.uploadedBy}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs text-text-secondary">Click to review</span>
                    <Button variant="link" size="sm">
                      Review <i className="fas fa-arrow-right ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Progress Dashboard */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Your Progress</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="text-white" />
              </div>
              <h3 className="font-semibold text-lg">{userStats?.gamesUploaded || 0}</h3>
              <p className="text-text-secondary text-sm">Games Uploaded</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="text-white" />
              </div>
              <h3 className="font-semibold text-lg">{userStats?.handsReviewed || 0}</h3>
              <p className="text-text-secondary text-sm">Hands Reviewed</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-white" />
              </div>
              <h3 className="font-semibold text-lg">{Math.round(userStats?.averageBiddingAccuracy || 0)}%</h3>
              <p className="text-text-secondary text-sm">Avg. Bidding Accuracy</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-white" />
              </div>
              <h3 className="font-semibold text-lg">{userStats?.commentsMade || 0}</h3>
              <p className="text-text-secondary text-sm">Comments Made</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
