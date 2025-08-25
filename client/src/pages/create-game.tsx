import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileUpload } from "@/components/ui/file-upload";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { Partnership } from "@shared/schema";

const gameSchema = z.object({
  name: z.string().min(1, "Game name is required"),
  description: z.string().optional(),
  partnerId: z.string().optional(),
  visibility: z.enum(["public", "private", "club"]),
});

type GameFormData = z.infer<typeof gameSchema>;

export default function CreateGame() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [pbnContent, setPbnContent] = useState<string>("");
  const [pbnPreview, setPbnPreview] = useState<{ boards: number; format: string }>({
    boards: 0,
    format: "Unknown",
  });

  const form = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "public",
    },
  });

  // Fetch user's partnerships for partner selection
  const { data: partnerships = [], isLoading: partnershipsLoading } = useQuery<Partnership[]>({
    queryKey: ['/api/partnerships'],
    enabled: !!token,
  });

  const createGameMutation = useMutation({
    mutationFn: async (data: GameFormData & { pbnContent?: string }) => {
      if (!token) throw new Error('Not authenticated');
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create game');
      }
      return response.json();
    },
    onSuccess: (game) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      toast({
        title: "Game created successfully",
        description: `"${game.name}" has been created.`,
      });
      setLocation(`/games/${game.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (file: File) => {
    const content = await file.text();
    setPbnContent(content);

    // Parse PBN for preview
    try {
      const response = await fetch('/api/pbn/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pbnContent: content }),
      });

      if (response.ok) {
        const result = await response.json();
        setPbnPreview({
          boards: result.count,
          format: "Standard PBN",
        });
      }
    } catch (error) {
      console.error('Error parsing PBN:', error);
      setPbnPreview({
        boards: 0,
        format: "Invalid",
      });
    }
  };

  const onSubmit = (data: GameFormData) => {
    createGameMutation.mutate({
      ...data,
      pbnContent: pbnContent || undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Game</h1>
        <p className="text-gray-600">Set up a new bridge game for analysis and discussion</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Game Details */}
            <Card>
              <CardHeader>
                <CardTitle>Game Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter game name..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your game or add notes..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partnerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select partner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No partner</SelectItem>
                          {partnershipsLoading ? (
                            <SelectItem value="" disabled>Loading partners...</SelectItem>
                          ) : partnerships.length > 0 ? (
                            partnerships.map((partnership: Partnership) => {
                              // Get the partner's ID (the other player in the partnership)
                              const isCurrentUserPlayer1 = partnership.player1Id === user?.id;
                              const partnerId = isCurrentUserPlayer1 ? partnership.player2Id : partnership.player1Id;
                              
                              return (
                                <SelectItem key={partnership.id} value={partnerId}>
                                  Partnership Partner ({partnership.gamesCount} games together)
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem value="" disabled>No partnerships found</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public - Visible to all players</SelectItem>
                          <SelectItem value="private">Private - Only visible to you and partner</SelectItem>
                          <SelectItem value="club">Club Members - Visible to club members</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Hand Records */}
            <Card>
              <CardHeader>
                <CardTitle>Hand Records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Upload PBN File</label>
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    accept=".pbn"
                    maxSize={10 * 1024 * 1024}
                  />
                </div>

                {pbnContent && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">PBN Preview</h4>
                    <div className="text-xs text-gray-500 font-mono bg-gray-50 border rounded p-2 max-h-32 overflow-y-auto">
                      {pbnContent.split('\n').slice(0, 10).join('\n')}
                      {pbnContent.split('\n').length > 10 && '\n...'}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span>Boards detected: {pbnPreview.boards}</span>
                      <span className="ml-4">Format: {pbnPreview.format}</span>
                    </div>
                  </div>
                )}

                
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <div className="text-sm text-gray-600">
              <span className="mr-2">ℹ️</span>
              Games are public by default to encourage learning and discussion
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createGameMutation.isPending}
                className="bg-bridge-green hover:bg-green-700 text-white"
              >
                {createGameMutation.isPending ? "Creating..." : "Create Game"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
