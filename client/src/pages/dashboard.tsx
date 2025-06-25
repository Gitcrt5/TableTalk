import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PBNUpload from "@/components/upload/pbn-upload";
import { Search, Upload, Calendar, User } from "lucide-react";
import { Link } from "wouter";
import type { Game } from "@shared/schema";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const filteredGames = games?.filter(game => 
    searchQuery === "" || 
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.tournament?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">TableTalk</h1>
        <p className="text-text-secondary">
          Upload and review bridge games with bidding analysis
        </p>
      </div>

      {/* Action Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => setShowUpload(true)} className="flex items-center space-x-2">
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
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-text-secondary">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No games found</h3>
                <p className="mb-4">
                  {searchQuery 
                    ? `No games match "${searchQuery}"`
                    : "Upload your first PBN file to get started"
                  }
                </p>
                <Button onClick={() => setShowUpload(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload PBN File
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredGames?.map((game) => (
            <Card key={game.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
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
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link href={`/games/${game.id}`}>
                      <Button>
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
