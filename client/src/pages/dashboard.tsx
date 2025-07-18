import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PBNUpload from "@/components/upload/pbn-upload";

import { Search, Upload, Calendar, User, FileText, MapPin } from "lucide-react";
import { Link } from "wouter";
import type { Game } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const { user } = useAuth();

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    staleTime: 0, // Always refetch on page load to get fresh data
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const filteredGames = games?.filter(game => 
    searchQuery === "" || 
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.tournament?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Action Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search games, tournaments, or uploaders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowUpload(true)} className="flex items-center space-x-2 whitespace-nowrap">
              <Upload className="h-4 w-4" />
              <span>Upload PBN</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Games List */}
      <div className="space-y-4">
        {gamesLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredGames?.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <div className="text-text-secondary">
                <Upload className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "No games match your search" : "No games yet"}
                </h3>
                <p className="mb-6 text-sm max-w-md mx-auto">
                  {searchQuery 
                    ? `Try adjusting your search for "${searchQuery}" or upload a new game`
                    : "Upload your first PBN file to start reviewing bridge games. PBN files contain bridge hand data and can be uploaded from your computer."
                  }
                </p>
                <Button onClick={() => setShowUpload(true)} size="lg">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload PBN File
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredGames?.map((game) => (
            <Card key={game.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-5 h-5 text-text-secondary" />
                      <h3 className="text-xl font-semibold text-text-primary hover:text-primary transition-colors">
                        {game.title || game.pbnEvent || game.filename}
                      </h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-2">
                      {(game.date || game.pbnDate || game.uploadedAt) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {game.date 
                              ? new Date(game.date).toLocaleDateString()
                              : game.pbnDate 
                              ? new Date(game.pbnDate).toLocaleDateString()
                              : new Date(game.uploadedAt).toLocaleDateString()
                            }
                          </span>
                        </div>
                      )}
                      
                      {(game.location || game.pbnSite) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{game.location || game.pbnSite}</span>
                        </div>
                      )}
                      
                      {game.round && (
                        <Badge variant="outline" className="text-xs">
                          {game.round}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-text-secondary">
                      <span>File: {game.filename || game.title}</span>
                      {game.uploaderName && (
                        <span> • Uploaded by {game.uploaderName}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link href={`/games/${game.id}`}>
                      <Button className="hover:bg-primary/90 transition-colors">
                        View Hands
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <PBNUpload open={showUpload} onOpenChange={setShowUpload} />
    </div>
  );
}
