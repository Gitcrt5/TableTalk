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

interface GameEditFormProps {
  game: Game;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function GameEditForm({ game, open: externalOpen, onOpenChange, onSuccess }: GameEditFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [locationValue, setLocationValue] = useState<ClubLocationValue>({
    clubId: game.clubId || undefined,
    location: game.location || undefined,
    displayName: game.location || undefined,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use external open state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  // Debug logging for dialog state
  console.log('GameEditForm render:', {
    gameId: game.id,
    externalOpen,
    internalOpen,
    isOpen,
    hasOnOpenChange: !!onOpenChange
  });

  // Create stable setOpen function that prevents unwanted closures
  const setOpen = (open: boolean) => {
    // Only allow closing via explicit user actions (form submission or cancel)
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

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
      onSuccess?.();
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

  // Prevent dialog from closing due to form changes
  const handleLocationChange = (newLocationValue: ClubLocationValue) => {
    // Add comprehensive debugging to track location changes
    console.log('=== LOCATION CHANGE START ===');
    console.log('New location value:', newLocationValue);
    console.log('Current form state:', form.getValues());
    console.log('Current dialog state:', isOpen);
    console.log('Form errors:', form.formState.errors);
    
    // Capture current dialog state to prevent unwanted closure
    const currentDialogState = isOpen;
    
    setLocationValue(newLocationValue);
    // Update form fields if needed
    if (newLocationValue.clubId) {
      form.setValue('clubId', newLocationValue.clubId);
    }
    if (newLocationValue.location) {
      form.setValue('location', newLocationValue.location);
    }
    
    // Ensure dialog remains open after location change
    if (currentDialogState && !isOpen) {
      console.warn('Dialog closed unexpectedly during location change, attempting to stabilize...');
      setTimeout(() => {
        if (onOpenChange && !isOpen) {
          onOpenChange(true);
        }
      }, 0);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={setOpen}
      modal={true}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => {
          // Allow clicks on the ClubLocationSelector search interface
          const target = e.target as Element;
          if (target.closest('[data-club-selector]') || target.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
      >
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