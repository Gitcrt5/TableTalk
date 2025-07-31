import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClubLocationSelector from "@/components/club-location-selector";
import { useAuth } from "@/hooks/useAuth";
import type { Game } from "@shared/schema";
import { ArrowLeft, Save } from "lucide-react";

interface ClubLocationValue {
  clubId?: number;
  location?: string;
  displayName?: string;
}

const gameEditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  location: z.string().optional(),
  clubId: z.number().optional(),
});

type GameEditFormData = z.infer<typeof gameEditSchema>;

export default function GameEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const gameId = parseInt(id!);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if this is a new game from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isNewGame = urlParams.get('new') === 'true';

  const [locationValue, setLocationValue] = useState<ClubLocationValue>({});
  const [isSelectingClub, setIsSelectingClub] = useState(false);

  // Fetch game data
  const { data: game, isLoading: gameLoading } = useQuery<Game>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (game && user && game.uploadedBy !== user.id) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit this game.",
        variant: "destructive",
      });
      setLocation(`/games/${gameId}`);
    }
  }, [game, user, gameId, setLocation, toast]);

  // Initialize location value when game loads
  useEffect(() => {
    if (game) {
      setLocationValue({
        clubId: game.clubId || undefined,
        location: game.location || undefined,
        displayName: game.location || undefined,
      });
    }
  }, [game]);

  const form = useForm<GameEditFormData>({
    resolver: zodResolver(gameEditSchema),
    defaultValues: {
      title: "",
      date: "",
      location: "",
      clubId: undefined,
    },
  });

  // Update form when game data loads
  useEffect(() => {
    if (game) {
      form.reset({
        title: game.title,
        date: game.date || "",
        location: game.location || "",
        clubId: game.clubId || undefined,
      });
    }
  }, [game, form]);

  const updateGameMutation = useMutation({
    mutationFn: async (data: GameEditFormData) => {
      const requestData = {
        ...data,
        clubId: locationValue.clubId || null,
        location: locationValue.location || null,
      };
      const response = await apiRequest(`/api/games/${gameId}`, {
        method: "PUT",
        body: JSON.stringify(requestData),
      });
      return response.json();
    },
    onSuccess: (updatedGame) => {
      // Update the cache
      queryClient.setQueryData([`/api/games/${gameId}`], updatedGame);
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/hands`] });

      toast({
        title: "Game Updated",
        description: "Game details have been successfully updated.",
      });

      // Stay on edit page - let user choose when to return
      console.log("Game updated successfully - staying on edit page");
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GameEditFormData) => {
    // Prevent submission during club selection
    if (isSelectingClub) {
      console.log("Form submission blocked during club selection");
      return;
    }
    console.log("Form submission allowed - user clicked Save");
    updateGameMutation.mutate(data);
  };

  const handleLocationChange = (newLocationValue: ClubLocationValue) => {
    // Set selection protection flag
    setIsSelectingClub(true);
    
    // Add comprehensive debugging to track location changes
    console.log('=== LOCATION CHANGE START ===');
    console.log('New location value:', newLocationValue);
    console.log('Current form state:', form.getValues());
    console.log('Current page location:', window.location.href);
    console.log('Form errors:', form.formState.errors);
    console.log('Selection protection activated');
    
    setLocationValue(newLocationValue);
    // Update form fields if needed
    if (newLocationValue.clubId) {
      form.setValue('clubId', newLocationValue.clubId);
    }
    if (newLocationValue.location) {
      form.setValue('location', newLocationValue.location);
    }
    
    // Clear selection flag after a short delay
    setTimeout(() => {
      setIsSelectingClub(false);
      console.log('Selection protection deactivated');
    }, 100);
    
    console.log('=== LOCATION CHANGE COMPLETE ===');
  };

  const handleCancel = () => {
    setLocation(`/games/${gameId}`);
  };

  if (gameLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Game not found</h2>
            <p className="text-muted-foreground mb-4">
              The requested game could not be found.
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Games
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Game
        </Button>

        <h1 className="text-2xl font-bold mb-2">Edit Game Details</h1>
        {isNewGame && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Welcome!</strong> Your PBN file has been uploaded successfully.
              Please update the game details below to complete the setup.
            </p>
          </div>
        )}
        {updateGameMutation.isSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <strong>Success!</strong> Game details have been saved successfully.
              Click "Back to Game" when you're ready to return.
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Game Information</CardTitle>
          <CardDescription>
            Update the game information such as date, location, and event details.
            {game.filename && (
              <div className="mt-2 text-sm text-muted-foreground">
                File: {game.filename}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Game title" 
                        {...field} 
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        placeholder="Game date" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div data-club-selector>
                <ClubLocationSelector
                  value={locationValue}
                  onChange={handleLocationChange}
                  showFreeText={true}
                  homeClubDefault={false}
                  label="Location"
                  placeholder="Select club or enter location"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateGameMutation.isPending || isSelectingClub}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateGameMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={updateGameMutation.isPending}
                >
                  Back to Game
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}