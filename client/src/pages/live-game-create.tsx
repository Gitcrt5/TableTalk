import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Star } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Club {
  id: number;
  name: string;
  isActive: boolean;
}

interface Partner {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
}

export default function LiveGameCreate() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    gameDate: format(new Date(), "yyyy-MM-dd"),
    partnerId: ""
  });

  const [locationValue, setLocationValue] = useState({});

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

  // Fetch user's favorite clubs
  const { data: favoriteClubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/user/favorite-clubs"],
    enabled: hasLiveGamesFeature,
  });

  // Fetch all clubs
  const { data: allClubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    enabled: hasLiveGamesFeature,
  });

  // Fetch user's partners
  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ["/api/user/partners"],
    enabled: hasLiveGamesFeature,
  });

  // Create live game mutation
  const createGameMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Convert "none" to null for the API
      const apiData = {
        ...data,
        partnerId: data.partnerId === "none" ? null : data.partnerId
      };

      const response = await fetch("/api/live-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });
      if (!response.ok) throw new Error("Failed to create game");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-games"] });
      toast({
        title: "Game created",
        description: "You can now start entering boards.",
      });
      setLocation(`/live-games/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
        if (!formData.title || !formData.gameDate || (!locationValue.clubId && !locationValue.location)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including location",
        variant: "destructive",
      });
      return;
    }

    createGameMutation.mutate({
      title: formData.title,
      gameDate: formData.gameDate,
      clubId: locationValue.clubId || undefined,
      location: locationValue.location || undefined,
      partnerId: formData.partnerId === "none" ? null : formData.partnerId || undefined,
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Live Game</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
              <Label>Location</Label>
              <ClubLocationSelector
                setLocationValue={setLocationValue}
                favoriteClubs={favoriteClubs}
                allClubs={allClubs}
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.gameDate}
                onChange={(e) => setFormData({ ...formData, gameDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="title">Event Name</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Friday Pairs"
                required
              />
            </div>

            <div>
              <Label htmlFor="partner">Partner (optional)</Label>
              <Select
                value={formData.partnerId}
                onValueChange={(value) => setFormData({ ...formData, partnerId: value })}
              >
                <SelectTrigger id="partner">
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No partner</SelectItem>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.displayName || partner.firstName} {partner.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={createGameMutation.isPending}
            >
              {createGameMutation.isPending ? "Creating..." : "Start Game"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}