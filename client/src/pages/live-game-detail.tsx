import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ArrowLeft, Plus, Calendar, MapPin, Users, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BiddingTable from "@/components/bridge/bidding-table";

interface LiveGame {
  id: number;
  title: string;
  clubId: number;
  clubName?: string;
  gameDate: string;
  createdBy: string;
  partnerId?: string;
  partnerName?: string;
  status: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

interface LiveHand {
  id: number;
  liveGameId: number;
  boardNumber: number;
  dealer?: string;
  vulnerability?: string;
  northHand?: string;
  southHand?: string;
  eastHand?: string;
  westHand?: string;
  biddingSequence?: string[];
  openingLead?: string;
  tricksTaken?: number;
  scoreMp?: string;
  scoreImp?: string;
  notes?: string;
  lastModified: string;
}

export default function LiveGameDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingBoard, setEditingBoard] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<LiveHand>>({});

  const { data: game, isLoading: gameLoading } = useQuery<LiveGame>({
    queryKey: [`/api/live-games/${id}`],
  });

  const { data: hands = [], isLoading: handsLoading } = useQuery<LiveHand[]>({
    queryKey: [`/api/live-games/${id}/hands`],
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: Partial<LiveHand>) => {
      return apiRequest(`/api/live-games/${id}/hands`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/live-games/${id}/hands`] });
      setEditingBoard(null);
      setFormData({});
      toast({
        title: "Board saved",
        description: "Board details have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save board. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEditingBoard = (boardNumber: number) => {
    const existingHand = hands.find(h => h.boardNumber === boardNumber);
    setFormData(existingHand || { boardNumber });
    setEditingBoard(boardNumber);
  };

  const handleSave = () => {
    if (!editingBoard) return;
    createOrUpdateMutation.mutate({
      ...formData,
      boardNumber: editingBoard,
    });
  };

  const cancelEditing = () => {
    setEditingBoard(null);
    setFormData({});
  };

  if (gameLoading || handsLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Live game not found.</p>
            <Link href="/live-games">
              <Button>Back to Live Games</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create array of boards (1-24 for a typical game)
  const boardNumbers = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Game Header */}
      <div className="mb-6">
        <Link href="/live-games">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Live Games
          </Button>
        </Link>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold">{game.title}</h1>
              <Badge variant={game.status === "completed" ? "default" : "secondary"}>
                {game.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(game.gameDate), "PPP")}</span>
              </div>

              {game.clubName && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{game.clubName}</span>
                </div>
              )}

              {game.partnerName && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Partner: {game.partnerName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {boardNumbers.map((boardNumber) => {
          const hand = hands.find(h => h.boardNumber === boardNumber);
          const isEditing = editingBoard === boardNumber;

          return (
            <Card key={boardNumber} className={isEditing ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Board {boardNumber}</h3>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditingBoard(boardNumber)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isEditing ? (
                  <div className="space-y-3">
                    {/* Dealer and Vulnerability */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Dealer</label>
                        <Select
                          value={formData.dealer || ""}
                          onValueChange={(value) => setFormData({ ...formData, dealer: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="N">North</SelectItem>
                            <SelectItem value="S">South</SelectItem>
                            <SelectItem value="E">East</SelectItem>
                            <SelectItem value="W">West</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Vul</label>
                        <Select
                          value={formData.vulnerability || ""}
                          onValueChange={(value) => setFormData({ ...formData, vulnerability: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="NS">NS</SelectItem>
                            <SelectItem value="EW">EW</SelectItem>
                            <SelectItem value="Both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Tricks</label>
                        <Input
                          type="number"
                          min="0"
                          max="13"
                          className="h-8"
                          value={formData.tricksTaken || ""}
                          onChange={(e) => setFormData({ ...formData, tricksTaken: parseInt(e.target.value) || undefined })}
                          placeholder="0-13"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">MP Score</label>
                        <Input
                          className="h-8"
                          value={formData.scoreMp || ""}
                          onChange={(e) => setFormData({ ...formData, scoreMp: e.target.value })}
                          placeholder="e.g., 75%"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Notes</label>
                      <Textarea
                        className="h-16 resize-none"
                        value={formData.notes || ""}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Add notes..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={createOrUpdateMutation.isPending}
                      >
                        <Save className="mr-1 h-3 w-3" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={createOrUpdateMutation.isPending}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {hand ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dealer:</span>
                          <span>{hand.dealer || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vul:</span>
                          <span>{hand.vulnerability || "-"}</span>
                        </div>
                        {hand.tricksTaken !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tricks:</span>
                            <span>{hand.tricksTaken}</span>
                          </div>
                        )}
                        {hand.scoreMp && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">MP:</span>
                            <span>{hand.scoreMp}</span>
                          </div>
                        )}
                        {hand.notes && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {hand.notes}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No data yet
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}