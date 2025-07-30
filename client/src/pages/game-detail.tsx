import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Calendar, User, Users, Plus, UserPlus, FileText } from "lucide-react";
import { Link, useParams } from "wouter";
import GameEditForm from "@/components/game-edit-form";
import RegularGamePbnAttachment from "@/components/RegularGamePbnAttachment";
import { useAuth } from "@/hooks/useAuth";
import { formatContract } from "@/lib/bridge-utils";
import { apiRequest } from "@/lib/queryClient";
import type { Game, Hand, User as UserType } from "@shared/schema";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  partnerId?: string; // For game players with partnership info
}

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const gameId = parseInt(id!);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isParticipationDialogOpen, setIsParticipationDialogOpen] = useState(false);
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | undefined>();

  // Check if we should auto-open the edit form (from upload redirect)
  const searchParams = new URLSearchParams(window.location.search);
  const shouldAutoEdit = searchParams.get('edit') === 'true';
  const isNewUpload = searchParams.get('new') === 'true';

  const { data: game, isLoading: gameLoading } = useQuery<Game & { canAttachPbn?: boolean; originatedFromLiveGame?: boolean }>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });

  const { data: hands, isLoading: handsLoading } = useQuery<Hand[]>({
    queryKey: [`/api/games/${gameId}/hands`],
    enabled: !!gameId,
  });

  // Fetch game players
  const { data: gamePlayers = [] } = useQuery<UserType[]>({
    queryKey: [`/api/games/${gameId}/players`],
    enabled: !!gameId,
  });

  // Fetch user's partners
  const { data: partners = [] } = useQuery<User[]>({
    queryKey: ["/api/user/partners"],
  });

  // Fetch game players to check for existing partnerships
  const { data: gamePlayersForPartnership = [] } = useQuery<User[]>({
    queryKey: [`/api/games/${gameId}/players`],
  });

  // Fetch user's participation data
  const { data: participationData } = useQuery<{
    isPlaying: boolean;
    partner?: UserType;
  }>({
    queryKey: [`/api/games/${gameId}/my-participation`],
    enabled: !!gameId && !!user,
  });

  const isCurrentUserPlaying = participationData?.isPlaying || false;
  const currentUserPartner = participationData?.partner;

  // Add participation mutation
  const addParticipationMutation = useMutation({
    mutationFn: async (partnerId?: string) => {
      return apiRequest(`/api/games/${gameId}/players`, {
        method: "POST",
        body: JSON.stringify({ partnerId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/players`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/my-participation`] });
      setIsParticipationDialogOpen(false);
      setIsPartnerDialogOpen(false);
      setSelectedPartner(undefined);
    },
  });

  // Update partner mutation
  const updatePartnerMutation = useMutation({
    mutationFn: async (partnerId?: string) => {
      return apiRequest(`/api/games/${gameId}/players`, {
        method: "POST",
        body: JSON.stringify({ partnerId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/my-participation`] });
      setIsPartnerDialogOpen(false);
      setSelectedPartner(undefined);
    },
  });

  // Remove participation mutation
  const removeParticipationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/games/${gameId}/players/${user?.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/players`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/my-participation`] });
    },
  });

  // Clean up URL parameter after it's been used, but wait for game data to load AND auto-edit to be processed
  useEffect(() => {
    if (shouldAutoEdit && game && user && user.id === game.uploadedBy) {
      // Wait a bit longer to ensure the GameEditForm component has time to process autoOpen
      setTimeout(() => {
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);
      }, 500);
    }
  }, [shouldAutoEdit, game, user]);

  if (gameLoading || handsLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <Skeleton className="h-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Game not found</h2>
            <p className="text-text-secondary mb-4">
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Button>
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-text-primary">
              {game.title}
            </h1>
            <div className="flex items-center space-x-2">
              {user && user.id === game.uploadedBy && (
                <GameEditForm game={game} autoOpen={shouldAutoEdit} />
              )}
              {user && user.id === game.uploadedBy && game.canAttachPbn && (
                <RegularGamePbnAttachment gameId={gameId}>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Attach PBN
                  </Button>
                </RegularGamePbnAttachment>
              )}
            </div>
          </div>
          {isNewUpload && shouldAutoEdit && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Welcome!</strong> Your PBN file has been uploaded successfully.
                Please update the game details below to complete the setup.
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 text-text-secondary">
            {game.date && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{game.date}</span>
              </div>
            )}

            {game.location && (
              <div className="flex items-center space-x-1">
                <span>📍</span>
                <span className="min-w-[120px]">{game.location}</span>
              </div>
            )}

            {game.tournament && (
              <div className="flex items-center space-x-1">
                <span>🏆 {game.tournament}</span>
              </div>
            )}

            {game.round && <Badge variant="outline">{game.round}</Badge>}

            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>Uploaded by {game.uploaderName || game.uploadedBy}</span>
            </div>

            <div className="flex items-center space-x-1 text-xs">
              <span>Uploaded {new Date(game.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Participation Banner */}
      {user && (
        <div className="mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Played this game</span>

                <Switch
                  checked={isCurrentUserPlaying}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setIsParticipationDialogOpen(true);
                    } else {
                      removeParticipationMutation.mutate();
                    }
                  }}
                  disabled={addParticipationMutation.isPending || removeParticipationMutation.isPending}
                  className={`${isCurrentUserPlaying ? 'data-[state=checked]:bg-green-600' : 'bg-gray-300'}`}
                />

                {isCurrentUserPlaying && currentUserPartner && (
                  <span className="text-sm text-gray-600">
                    Partner: {currentUserPartner.displayName || `${currentUserPartner.firstName} ${currentUserPartner.lastName}`}
                  </span>
                )}

                {isCurrentUserPlaying && !currentUserPartner && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsPartnerDialogOpen(true)}
                    className="h-7 text-xs"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Add Partner
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partner Selection Dialog for Toggle */}
      <Dialog open={isParticipationDialogOpen} onOpenChange={setIsParticipationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Game Participation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Mark yourself as having played in this game. Optionally select your partner.
            </p>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Partner (optional)
              </label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger>
                  <SelectValue placeholder="Select partner (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No partner / Unknown</SelectItem>
                  {partners.map(partner => {
                    // Check if this partner is already playing with someone else
                    const existingPlayer = gamePlayersForPartnership.find(player => player.id === partner.id);
                    const isUnavailable = existingPlayer && existingPlayer.partnerId && participationData?.partner?.id !== partner.id;

                    return (
                      <SelectItem 
                        key={partner.id} 
                        value={partner.id}
                        disabled={!!isUnavailable}
                        className={isUnavailable ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{partner.displayName || `${partner.firstName} ${partner.lastName}`}</span>
                          {isUnavailable && (
                            <span className="text-xs text-muted-foreground ml-2">(Already paired)</span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsParticipationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => addParticipationMutation.mutate(selectedPartner === "none" ? undefined : selectedPartner)}
                disabled={addParticipationMutation.isPending}
              >
                {addParticipationMutation.isPending ? "Adding..." : "Mark as Played"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Partner Selection Dialog for Adding Partner */}
      <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Select the partner you played with in this game.
            </p>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Partner
              </label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger>
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map(partner => {
                    // Check if this partner is already playing with someone else
                    const existingPlayer = gamePlayersForPartnership.find(player => player.id === partner.id);
                    const isUnavailable = existingPlayer && existingPlayer.partnerId && participationData?.partner?.id !== partner.id;

                    return (
                      <SelectItem 
                        key={partner.id} 
                        value={partner.id}
                        disabled={!!isUnavailable}
                        className={isUnavailable ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{partner.displayName || `${partner.firstName} ${partner.lastName}`}</span>
                          {isUnavailable && (
                            <span className="text-xs text-muted-foreground ml-2">(Already paired)</span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsPartnerDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => updatePartnerMutation.mutate(selectedPartner)}
                disabled={updatePartnerMutation.isPending || !selectedPartner}
              >
                {updatePartnerMutation.isPending ? "Adding..." : "Add Partner"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hands List */}
      {hands && hands.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Hands ({hands.length})</h2>
            <Badge variant="outline" className="text-xs">
              {hands.filter(h => h.hasBidding).length} with bidding
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hands.map((hand) => (
              <Card key={hand.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Link to={`/hands/${hand.id}`}>
                        <Button className="mb-2 h-auto">
                          Board {hand.boardNumber}
                        </Button>
                      </Link>
                      <p className="text-text-secondary text-sm">
                        Dealer: {hand.dealer} • Vul: {hand.vulnerability}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      {hand.hasBidding ? (
                        <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">Has bidding</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">No bidding</Badge>
                      )}
                      {hand.commentCount && hand.commentCount > 0 ? (
                        <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">
                          {hand.commentCount} comment{hand.commentCount !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">No comments</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {/* Only show contract details to players who played this game */}
                    {isCurrentUserPlaying && hand.finalContract && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Contract: </span>
                        <span className="font-medium">
                          {(() => {
                            const contractText = `${hand.finalContract} by ${hand.declarer}`;
                            const { contractPart, declarerPart, isRed } = formatContract(contractText);
                            return (
                              <>
                                <span className={isRed ? "text-red-600" : ""}>
                                  {contractPart}
                                </span>
                                {declarerPart && <span> {declarerPart}</span>}
                              </>
                            );
                          })()}
                        </span>
                      </div>
                    )}


                  </div>


                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-text-secondary">
              <h3 className="text-lg font-semibold mb-2">No hands found</h3>
              <p>This game doesn't contain any hands yet.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}