import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import ClubLocationSelector from "./club-location-selector";
import type { Game } from "@shared/schema";
import { Edit } from "lucide-react";

const gameEditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  location: z.string().optional(),
  clubId: z.number().optional(),
});

type GameEditFormData = z.infer<typeof gameEditSchema>;

interface GameEditFormProps {
  game: Game;
  autoOpen?: boolean;
}

export default function GameEditForm({ game, autoOpen = false }: GameEditFormProps) {
  const [open, setOpen] = useState(false);
  const [locationValue, setLocationValue] = useState({
    clubId: game.clubId || undefined,
    location: game.location || undefined,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-open if requested (e.g., after upload)
  useEffect(() => {
    if (autoOpen) {
      setOpen(true);
    }
  }, [autoOpen]);

  const form = useForm<GameEditFormData>({
    resolver: zodResolver(gameEditSchema),
    defaultValues: {
      title: game.title,
      date: game.date || "",
      location: game.location || "",
      clubId: game.clubId || undefined,
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: async (data: GameEditFormData) => {
      const requestData = {
        ...data,
        clubId: locationValue.clubId || null,
        location: locationValue.location || null,
      };
      const response = await apiRequest(`/api/games/${game.id}`, {
        method: "PUT",
        body: JSON.stringify(requestData),
      });
      return response.json();
    },
    onSuccess: (updatedGame) => {
      // Update the cache with the new data immediately
      queryClient.setQueryData([`/api/games/${game.id}`], updatedGame);

      // Invalidate all games queries to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${game.id}/hands`] });

      // Force refetch of games list to ensure fresh data
      queryClient.refetchQueries({ queryKey: ["/api/games"] });

      toast({
        title: "Game Updated",
        description: "Game details have been successfully updated.",
      });
      setOpen(false);
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
    updateGameMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Game Details</DialogTitle>
          <DialogDescription>
            Update the game information such as date, location, and event details.
            {game.filename && (
              <div className="mt-2 text-sm text-muted-foreground">
                File: {game.filename}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Game title" {...field} className="focus:ring-2 focus:ring-blue-500"/>
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

            <div>
              <ClubLocationSelector
                value={locationValue}
                onChange={setLocationValue}
                showFreeText={true}
                homeClubDefault={false}
                label="Location"
                placeholder="Select club or enter location"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateGameMutation.isPending}>
                {updateGameMutation.isPending ? "Updating..." : "Update Game"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}