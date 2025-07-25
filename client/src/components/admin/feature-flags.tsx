import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Flag, Search, User } from "lucide-react";

interface User {
  id: string;
  email: string;
  displayName: string;
  userType: string;
  featureFlags?: Record<string, boolean>;
}

export default function FeatureFlags() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateFeatureFlagsMutation = useMutation({
    mutationFn: async ({ userId, featureFlags }: { userId: string; featureFlags: Record<string, boolean> }) => 
      apiRequest(`/api/admin/users/${userId}/feature-flags`, {
        method: "PATCH",
        body: JSON.stringify({ featureFlags }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Feature flags updated",
        description: "The user's feature flags have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating feature flags",
        description: error.message || "Failed to update feature flags",
        variant: "destructive",
      });
    },
  });

  const handleToggleFlag = (userId: string, currentFlags: Record<string, boolean> | undefined, flagName: string) => {
    const newFlags = {
      ...currentFlags,
      [flagName]: !currentFlags?.[flagName],
    };
    updateFeatureFlagsMutation.mutate({ userId, featureFlags: newFlags });
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Known feature flags
  const knownFlags = ["liveGames"];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Feature Flags Management
          </CardTitle>
          <CardDescription>
            Enable or disable experimental features for specific users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No users found matching your search
              </p>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {user.displayName || `${user.email}`}
                        </h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <Badge variant="secondary" className="mt-1">
                          {user.userType}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-muted-foreground">Feature Flags:</h5>
                      {knownFlags.map((flag) => (
                        <div key={flag} className="flex items-center justify-between">
                          <label htmlFor={`${user.id}-${flag}`} className="text-sm font-medium">
                            {flag}
                          </label>
                          <Switch
                            id={`${user.id}-${flag}`}
                            checked={user.featureFlags?.[flag] || false}
                            onCheckedChange={() => handleToggleFlag(user.id, user.featureFlags, flag)}
                            disabled={updateFeatureFlagsMutation.isPending}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}