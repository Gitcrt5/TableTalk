import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Comment } from "@shared/schema";

interface CommentsSectionProps {
  handId: number;
}

export default function CommentsSection({ handId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [commentFilter, setCommentFilter] = useState<"all" | "partnership">("all");
  
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const { data: comments, isLoading, error } = useQuery<Comment[]>({
    queryKey: ["/api/hands", handId, "comments", commentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (commentFilter === "partnership" && user?.id) {
        params.append("partnershipOnly", "true");
        params.append("userId", user.id);
      }
      
      const response = await fetch(`/api/hands/${handId}/comments?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }
      const data = await response.json();

      return data;
    },
    staleTime: 0,
    retry: false,
  });


  
  // Filter out any invalid entries
  const validComments = comments?.filter(comment => 
    comment && 
    comment.id && 
    comment.content && 
    comment.content.trim() !== ''
  ) || [];



  const createCommentMutation = useMutation({
    mutationFn: async (commentData: {
      content: string;
    }) => {
      const response = await apiRequest(`/api/hands/${handId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          ...commentData,
          userLevel: "Player", // Default level for now
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create comment: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hands", handId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hands", handId, "comments", "all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hands", handId, "comments", "partnership"] });
      setNewComment("");
    },
    onError: (error) => {
      console.error("Error creating comment:", error);
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim() || !isAuthenticated) return;
    
    createCommentMutation.mutate({
      content: newComment.trim(),
    });
  };



  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Discussion & Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Comment Filter Tabs */}
        <Tabs value={commentFilter} onValueChange={(value) => setCommentFilter(value as "all" | "partnership")} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>All Comments</span>
            </TabsTrigger>
            <TabsTrigger value="partnership" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Partnership Comments</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {/* Comments List for All Comments */}
            {isLoading ? (
              <div className="space-y-4 mb-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : validComments.length > 0 ? (
              <div className="space-y-4 mb-6">
                {validComments.map((comment: Comment) => (
                  <div key={comment.id} className="border-l-4 border-primary pl-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold">{comment.userName || "Anonymous"}</span>
                      <span className="text-text-secondary text-sm">
                        {comment.createdAt ? getTimeAgo(comment.createdAt) : "Just now"}
                      </span>
                    </div>
                    <p className="text-text-primary mb-3">{comment.content || "No content"}</p>
                    {/* TODO: Add like, reply, and report functionality in future update */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-text-secondary">No comments yet. Start the discussion!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="partnership" className="mt-4">
            {/* Comments List for Partnership Comments */}
            {isLoading ? (
              <div className="space-y-4 mb-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : validComments.length > 0 ? (
              <div className="space-y-4 mb-6">
                {validComments.map((comment: Comment) => (
                  <div key={comment.id} className="border-l-4 border-green-500 pl-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold">{comment.userName || "Anonymous"}</span>
                      <span className="text-text-secondary text-sm">
                        {comment.createdAt ? getTimeAgo(comment.createdAt) : "Just now"}
                      </span>
                    </div>
                    <p className="text-text-primary mb-3">{comment.content || "No content"}</p>
                    {/* TODO: Add like, reply, and report functionality in future update */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-text-secondary">
                  {commentFilter === "partnership" 
                    ? "No partnership comments yet. Add partners to see private discussions!" 
                    : "No comments yet. Start the discussion!"
                  }
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Comment Input */}
        {isAuthenticated ? (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-white">
                  <MessageSquare className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Share your analysis of this hand..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
                <div className="flex justify-end mt-3">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || createCommentMutation.isPending}
                  >
                    {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Sign in to join the discussion</p>
            <Button onClick={() => window.location.href = '/api/login'}>
              Sign In to Comment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
