import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { HandDisplay } from "@/components/bridge/HandDisplay";
import { BiddingPad } from "@/components/bridge/BiddingPad";
import { SuitSymbol } from "@/components/bridge/SuitSymbol";
import { Board, Comment, Bid, BridgeHands, Direction } from "@shared/schema";

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  
  const [biddingSequence, setBiddingSequence] = useState<Bid[]>([]);
  const [contract, setContract] = useState("");
  const [declarer, setDeclarer] = useState<Direction>("S");
  const [result, setResult] = useState<number | undefined>();
  const [leadCard, setLeadCard] = useState("");
  const [notes, setNotes] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isPrivateComment, setIsPrivateComment] = useState(false);

  const { data: board } = useQuery({
    queryKey: ['/api/boards', boardId],
    enabled: !!boardId,
    queryFn: async () => {
      const response = await fetch(`/api/boards/${boardId}`);
      if (!response.ok) throw new Error('Failed to fetch board');
      return response.json() as Promise<Board>;
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['/api/boards', boardId, 'comments'],
    enabled: !!boardId,
    queryFn: async () => {
      const response = await fetch(`/api/boards/${boardId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json() as Promise<Comment[]>;
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: async (updates: Partial<Board>) => {
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update board');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards', boardId] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; isPrivate: boolean }) => {
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(`/api/boards/${boardId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(commentData),
      });
      if (!response.ok) throw new Error('Failed to add comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards', boardId, 'comments'] });
      setNewComment("");
    },
  });

  const handleBid = (bid: Bid) => {
    setBiddingSequence(prev => [...prev, bid]);
  };

  const handleUndo = () => {
    setBiddingSequence(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setBiddingSequence([]);
  };

  const handleSaveBoard = () => {
    updateBoardMutation.mutate({
      biddingSequence: biddingSequence as any,
      contract,
      declarer,
      result,
      leadCard,
      notes,
    });
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate({
        content: newComment,
        isPrivate: isPrivateComment,
      });
    }
  };

  if (!board) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bridge-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading board...</p>
        </div>
      </div>
    );
  }

  const hands = board.hands as BridgeHands;
  const currentBidder: Direction = "S"; // This would be calculated based on dealer and bidding sequence

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Board {board.boardNumber}</h1>
        <p className="text-gray-600">
          Dealer: {board.dealer} • Vulnerability: {board.vulnerability}
        </p>
      </div>

      {/* Bridge Hand Layout */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* North */}
            <div className="col-start-2 flex justify-center">
              <HandDisplay hand={hands.N} position="N" />
            </div>

            {/* West */}
            <div className="row-start-2 flex justify-end">
              <HandDisplay hand={hands.W} position="W" />
            </div>

            {/* East */}
            <div className="row-start-2 col-start-3 flex justify-start">
              <HandDisplay hand={hands.E} position="E" />
            </div>

            {/* South (User) */}
            <div className="row-start-3 col-start-2 flex justify-center">
              <HandDisplay hand={hands.S} position="S" isUser />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bidding and Results */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Bidding */}
        <Card>
          <CardHeader>
            <CardTitle>Bidding</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Bidding sequence display */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Bidding Sequence</h4>
              <div className="min-h-[60px] border rounded-lg p-3 bg-gray-50">
                {biddingSequence.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {biddingSequence.map((bid, index) => (
                      <span key={index} className="px-2 py-1 bg-white border rounded text-sm">
                        {bid.call === "BID" ? (
                          <>
                            {bid.level}
                            <SuitSymbol suit={bid.suit!} />
                          </>
                        ) : (
                          bid.call
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No bids yet</div>
                )}
              </div>
            </div>

            <BiddingPad
              currentBidder={currentBidder}
              onBid={handleBid}
              onUndo={handleUndo}
              onClear={handleClear}
            />
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Contract & Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contract</label>
                  <Input
                    placeholder="e.g., 4H"
                    value={contract}
                    onChange={(e) => setContract(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Declarer</label>
                  <Select value={declarer} onValueChange={(value) => setDeclarer(value as Direction)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">North</SelectItem>
                      <SelectItem value="E">East</SelectItem>
                      <SelectItem value="S">South</SelectItem>
                      <SelectItem value="W">West</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tricks Taken</label>
                  <Input
                    type="number"
                    min="0"
                    max="13"
                    value={result || ""}
                    onChange={(e) => setResult(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Opening Lead</label>
                  <Input
                    placeholder="e.g., SQ"
                    value={leadCard}
                    onChange={(e) => setLeadCard(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Textarea
                  placeholder="Add notes about the play..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSaveBoard}
                disabled={updateBoardMutation.isPending}
                className="w-full bg-bridge-green hover:bg-green-700"
              >
                {updateBoardMutation.isPending ? "Saving..." : "Save Board"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Discussion & Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {comments.map(comment => (
              <div key={comment.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-bridge-green text-white text-xs flex items-center justify-center">
                      {comment.authorId.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">User</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    {comment.isPrivate && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        Private
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>

          {user && (
            <div className="border-t pt-4">
              <Textarea
                placeholder="Add your analysis or questions about this board..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="private"
                    checked={isPrivateComment}
                    onChange={(e) => setIsPrivateComment(e.target.checked)}
                  />
                  <label htmlFor="private" className="text-sm text-gray-600">
                    Private to partnership
                  </label>
                </div>
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  className="bg-bridge-green hover:bg-green-700"
                >
                  {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
