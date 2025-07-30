
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Star, Search, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Club } from "@shared/schema";

interface ClubLocationValue {
  clubId?: number;
  location?: string;
  displayName?: string;
}

interface ClubLocationSelectorProps {
  value: ClubLocationValue;
  onChange: (value: ClubLocationValue) => void;
  showFreeText?: boolean;
  homeClubDefault?: boolean;
  label?: string;
  placeholder?: string;
}

export default function ClubLocationSelector({
  value,
  onChange,
  showFreeText = true,
  homeClubDefault = true,
  label = "Location",
  placeholder = "Search for a club or enter location"
}: ClubLocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'club' | 'freetext'>(
    value.clubId ? 'club' : 'freetext'
  );

  // Get user's home club and favorites
  const { data: homeClub } = useQuery({
    queryKey: ["/api/user/clubs/home"],
    queryFn: async () => {
      const response = await apiRequest("/api/user/clubs/home");
      return response.json();
    }
  });

  const { data: favoriteClubs = [] } = useQuery({
    queryKey: ["/api/user/clubs/favorites"],
    queryFn: async () => {
      const response = await apiRequest("/api/user/clubs/favorites");
      return response.json();
    }
  });

  // Search for clubs
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/clubs/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];
      const response = await apiRequest(`/api/clubs/search?query=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.length >= 2
  });

  // Set default to home club if enabled and no value set
  useEffect(() => {
    if (homeClubDefault && homeClub && !value.clubId && !value.location) {
      onChange({
        clubId: homeClub.id,
        displayName: homeClub.name
      });
    }
  }, [homeClub, homeClubDefault, value, onChange]);

  const handleClubSelect = (club: Club) => {
    onChange({
      clubId: club.id,
      displayName: club.name
    });
    setSelectedMode('club');
    // Keep search open briefly to show selection, then close
    setSearchQuery("");
    setTimeout(() => {
      setShowSearch(false);
    }, 100);
  };

  const handleFreeTextChange = (location: string) => {
    onChange({
      location,
      displayName: location
    });
    setSelectedMode('freetext');
  };

  const handleClear = () => {
    onChange({});
    setSelectedMode('freetext');
    setShowSearch(false);
    setSearchQuery("");
  };

  const formatClubLocation = (club: Club) => {
    const parts = [club.location, club.state, club.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "";
  };

  const currentClub = value.clubId ? 
    [...favoriteClubs, ...(homeClub ? [homeClub] : []), ...searchResults]
      .find(club => club.id === value.clubId) : null;

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Current Selection Display */}
      {(value.clubId || value.location) && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {currentClub ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{currentClub.name}</span>
                      {homeClub?.id === currentClub.id && (
                        <Badge variant="secondary" className="text-xs">Home</Badge>
                      )}
                    </div>
                    {formatClubLocation(currentClub) && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {formatClubLocation(currentClub)}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{value.location}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Mode Toggle */}
      {!value.clubId && !value.location && (
        <div className="flex gap-2">
          <Button
            variant={selectedMode === 'club' ? 'default' : 'outline'}
            onClick={() => {
              setSelectedMode('club');
              setShowSearch(true);
            }}
            className="flex-1"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Select Club
          </Button>
          {showFreeText && (
            <Button
              variant={selectedMode === 'freetext' ? 'default' : 'outline'}
              onClick={() => {
                setSelectedMode('freetext');
                setShowSearch(false);
              }}
              className="flex-1"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Other Location
            </Button>
          )}
        </div>
      )}

      {/* Change Club/Location button when something is selected */}
      {(value.clubId || value.location) && (
        <Button
          variant="outline"
          onClick={() => {
            setSelectedMode('club');
            setShowSearch(true);
          }}
          className="w-full"
        >
          <Building2 className="w-4 h-4 mr-2" />
          Change Location
        </Button>
      )}

      {/* Club Search Interface */}
      {selectedMode === 'club' && showSearch && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
            >
              Done
            </Button>
          </div>

          {/* Quick Access: Home Club */}
          {homeClub && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Home Club
              </div>
              <Card className="cursor-pointer hover:bg-muted/50" onClick={() => handleClubSelect(homeClub)}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{homeClub.name}</div>
                      {formatClubLocation(homeClub) && (
                        <div className="text-sm text-muted-foreground">{formatClubLocation(homeClub)}</div>
                      )}
                    </div>
                    <Badge variant="secondary">Home</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Access: Favorite Clubs */}
          {favoriteClubs.length > 0 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Star className="w-3 h-3" />
                Favorites
              </div>
              <div className="space-y-2">
                {favoriteClubs.map((club: Club) => (
                  <Card 
                    key={club.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleClubSelect(club)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{club.name}</div>
                          {formatClubLocation(club) && (
                            <div className="text-sm text-muted-foreground">{formatClubLocation(club)}</div>
                          )}
                        </div>
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Search Results ({searchResults.length})
              </div>
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((club: Club) => (
                    <Card 
                      key={club.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleClubSelect(club)}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium">{club.name}</div>
                        {formatClubLocation(club) && (
                          <div className="text-sm text-muted-foreground">{formatClubLocation(club)}</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No clubs found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Free Text Input */}
      {selectedMode === 'freetext' && !value.clubId && (
        <Input
          placeholder={placeholder}
          value={value.location || ""}
          onChange={(e) => handleFreeTextChange(e.target.value)}
        />
      )}
    </div>
  );
}
