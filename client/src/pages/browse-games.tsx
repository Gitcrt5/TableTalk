import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/layout/sidebar";
import { Search, Calendar, User, Eye } from "lucide-react";
import { Link } from "wouter";
import type { Game } from "@shared/schema";

export default function BrowseGames() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const filteredGames = games?.filter(game => 
    searchQuery === "" || 
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.tournament?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <Sidebar />
        </aside>

        <main className="lg:col-span-3">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Browse Games</h1>
            <p className="text-text-secondary">
              Explore uploaded bridge games and practice hands
            </p>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search games, tournaments, or players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button>Search</Button>
              </div>
            </CardContent>
          </Card>

          {/* Games Grid */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex space-x-4">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredGames?.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-text-secondary">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No games found</h3>
                    <p>
                      {searchQuery 
                        ? `No games match "${searchQuery}"`
                        : "No games have been uploaded yet"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredGames?.map((game) => (
                <Card key={game.id} className="material-shadow hover:material-shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-text-primary mb-2">
                              {game.title}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-4">
                              {game.tournament && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{game.tournament}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>Uploaded by {game.uploadedBy}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(game.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {game.round && (
                              <Badge variant="outline" className="mb-4">
                                {game.round}
                              </Badge>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-text-secondary">
                              <span className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>View hands</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link href={`/games/${game.id}`}>
                          <Button>
                            View Game
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Load More */}
          {filteredGames && filteredGames.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg">
                Load More Games
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
