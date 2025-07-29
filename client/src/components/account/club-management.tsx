
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, X, MapPin, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Club {
  id: number;
  name: string;
  location: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  email: string | null;
  isActive: boolean;
}

export default function ClubManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's home club
  const { data: homeClub } = useQuery({
    queryKey: ["/api/user/clubs/home"],
    queryFn: async () => {
      const response = await apiRequest("/api/user/clubs/home");
      return await response.json();
    }
  });

  // Fetch user's favorite clubs
  const { data: favoriteClubs = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["/api/user/clubs/favorites"],
    queryFn: async () => {
      const response = await apiRequest("/api/user/clubs/favorites");
      return await response.json();
    }
  });

  // Search clubs
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["/api/clubs/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await apiRequest(`/api/clubs/search?query=${encodeURIComponent(searchQuery)}`);
      return await response.json();
    },
    enabled: searchQuery.length >= 2
  });

  // Set home club mutation
  const setHomeClubMutation = useMutation({
    mutationFn: async (clubId: number | null) => {
      const response = await apiRequest("/api/user/clubs/home", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set home club");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/clubs/home"] });
      toast({ title: "Home club updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Add favorite club mutation
  const addFavoriteClubMutation = useMutation({
    mutationFn: async (clubId: number) => {
      const response = await apiRequest("/api/user/clubs/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add favorite club");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/clubs/favorites"] });
      setIsSearchDialogOpen(false);
      setSearchQuery("");
      toast({ title: "Club added to favorites" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Remove favorite club mutation
  const removeFavoriteClubMutation = useMutation({
    mutationFn: async (clubId: number) => {
      const response = await apiRequest(`/api/user/clubs/favorites/${clubId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove favorite club");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/clubs/favorites"] });
      toast({ title: "Club removed from favorites" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSetHomeClub = () => {
    const clubId = selectedClubId ? parseInt(selectedClubId) : null;
    setHomeClubMutation.mutate(clubId);
  };

  const handleAddFavorite = (club: Club) => {
    addFavoriteClubMutation.mutate(club.id);
  };

  const handleRemoveFavorite = (clubId: number) => {
    removeFavoriteClubMutation.mutate(clubId);
  };

  const formatClubLocation = (club: Club) => {
    const parts = [club.location, club.state, club.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Location not specified";
  };

  return (
    <div className="space-y-8">
      {/* Home Club Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Home Club
          </CardTitle>
          <CardDescription>
            Set your primary bridge club. This will be used as your default location for games.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {homeClub && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{homeClub.name}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {formatClubLocation(homeClub)}
                  </p>
                </div>
                <Badge variant="secondary">Home Club</Badge>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Select value={selectedClubId} onValueChange={setSelectedClubId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Search and select a club..." />
              </SelectTrigger>
              <SelectContent>
                {searchQuery.length >= 2 && (
                  <>
                    {searchLoading && (
                      <SelectItem value="loading" disabled>Searching...</SelectItem>
                    )}
                    {!searchLoading && searchResults.length === 0 && (
                      <SelectItem value="no-results" disabled>No clubs found</SelectItem>
                    )}
                    {searchResults.map((club: Club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        <div>
                          <div className="font-medium">{club.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatClubLocation(club)}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <Input
              placeholder="Type to search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSetHomeClub}
              disabled={setHomeClubMutation.isPending}
            >
              {setHomeClubMutation.isPending ? "Setting..." : "Set Home Club"}
            </Button>
          </div>
          
          {homeClub && (
            <Button 
              variant="outline" 
              onClick={() => setHomeClubMutation.mutate(null)}
              disabled={setHomeClubMutation.isPending}
            >
              Clear Home Club
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Favorite Clubs Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Favorite Clubs
              </CardTitle>
              <CardDescription>
                Add up to 5 clubs to your favorites for quick access. ({favoriteClubs.length}/5)
              </CardDescription>
            </div>
            <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={favoriteClubs.length >= 5}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Club
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Favorite Club</DialogTitle>
                  <DialogDescription>
                    Search for a club to add to your favorites
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clubs by name or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchQuery.length < 2 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Type at least 2 characters to search
                      </p>
                    )}
                    
                    {searchLoading && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Searching...
                      </p>
                    )}
                    
                    {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No clubs found
                      </p>
                    )}
                    
                    {searchResults.map((club: Club) => {
                      const isAlreadyFavorite = favoriteClubs.some((fav: Club) => fav.id === club.id);
                      const isHomeClub = homeClub?.id === club.id;
                      
                      return (
                        <div key={club.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{club.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatClubLocation(club)}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {isHomeClub && <Badge variant="secondary" className="text-xs">Home</Badge>}
                              {isAlreadyFavorite && <Badge variant="outline" className="text-xs">Favorite</Badge>}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddFavorite(club)}
                            disabled={isAlreadyFavorite || addFavoriteClubMutation.isPending}
                          >
                            {isAlreadyFavorite ? "Added" : "Add"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {favoritesLoading && (
            <p className="text-muted-foreground">Loading favorite clubs...</p>
          )}
          
          {!favoritesLoading && favoriteClubs.length === 0 && (
            <p className="text-muted-foreground">No favorite clubs added yet.</p>
          )}
          
          {!favoritesLoading && favoriteClubs.length > 0 && (
            <div className="grid gap-3">
              {favoriteClubs.map((club: Club) => (
                <div key={club.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{club.name}</h4>
                      {homeClub?.id === club.id && (
                        <Badge variant="secondary" className="text-xs">Home</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {formatClubLocation(club)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFavorite(club.id)}
                    disabled={removeFavoriteClubMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
