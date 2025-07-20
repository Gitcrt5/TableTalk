import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, X } from "lucide-react";
import { User } from "@shared/schema";

interface Partner {
  id: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export function PartnerManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get current partners
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["/api/user/partners"],
    enabled: true,
  });

  // Add partner mutation
  const addPartnerMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      return apiRequest("/api/user/partners", {
        method: "POST",
        body: JSON.stringify({ partnerId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/partners"] });
      setSearchQuery("");
      setSearchResults([]);
    },
  });

  // Remove partner mutation
  const removePartnerMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      return apiRequest(`/api/user/partners/${partnerId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/partners"] });
    },
  });

  // Search users
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const results = await response.json();
      console.log("Search results:", results);
      console.log("Search results type:", typeof results);
      console.log("Search results length:", results?.length);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getDisplayName = (user: User) => {
    return user.displayName || `${user.firstName} ${user.lastName}` || user.email;
  };

  if (isLoading) {
    return <div>Loading partners...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partner Management</CardTitle>
        <CardDescription>
          Add bridge partners to easily select them during game uploads and view partnership discussions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Partners */}
        <div>
          <h3 className="font-semibold mb-3">Your Partners</h3>
          {partners.length > 0 ? (
            <div className="space-y-2">
              {partners.map((partner: User) => (
                <div key={partner.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{getDisplayName(partner)}</div>
                    <div className="text-sm text-muted-foreground">{partner.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePartnerMutation.mutate(partner.id)}
                    disabled={removePartnerMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No partners added yet.</p>
          )}
        </div>

        {/* Add Partner */}
        <div>
          <h3 className="font-semibold mb-3">Add Partner</h3>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Results */}
          {isSearching && <div className="text-sm text-muted-foreground">Searching...</div>}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Search Results</h4>
              {searchResults.map((user) => {
                const isAlreadyPartner = partners.some((p: User) => p.id === user.id);
                
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{getDisplayName(user)}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    {isAlreadyPartner ? (
                      <Badge variant="secondary">Already Partner</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => addPartnerMutation.mutate(user.id)}
                        disabled={addPartnerMutation.isPending}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Partner
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
            <div className="text-sm text-muted-foreground">No users found matching "{searchQuery}"</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}