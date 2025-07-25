import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Users, ArrowRight, Plus, Search } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

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

export default function LiveGames() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user has live games feature
  const hasLiveGamesFeature = user?.featureFlags?.liveGames === true;

  if (!hasLiveGamesFeature) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">This feature is not available for your account.</p>
            <Link href="/">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: liveGames = [], isLoading } = useQuery<LiveGame[]>({
    queryKey: ["/api/live-games"],
    enabled: hasLiveGamesFeature,
  });

  const filteredGames = liveGames.filter(game =>
    searchQuery === "" ||
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.clubName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Live Games</h1>
        <p className="text-muted-foreground">Enter bidding and results during play</p>
      </div>

      {/* Action Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search games or clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Link href="/live-games/create">
              <Button className="flex items-center space-x-2 whitespace-nowrap">
                <Plus className="h-4 w-4" />
                <span>New Live Game</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Games List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredGames.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <div className="text-text-secondary">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "No games match your search" : "No live games yet"}
                </h3>
                <p className="mb-6 text-sm max-w-md mx-auto">
                  {searchQuery
                    ? `Try adjusting your search for "${searchQuery}"`
                    : "Create a live game to start entering bidding and results during play."}
                </p>
                <Link href="/live-games/create">
                  <Button size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Live Game
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredGames.map((game) => (
            <Card key={game.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-text-primary hover:text-primary transition-colors">
                        {game.title}
                      </h3>
                      <Badge variant={game.status === "completed" ? "default" : "secondary"}>
                        {game.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-2">
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
                  </div>

                  <Link href={`/live-games/${game.id}`}>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}