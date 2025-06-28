import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, ThumbsUp, Reply, Flag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Comment } from "@shared/schema";

interface CommentsSectionProps {
  handId: number;
}

export default function CommentsSection({ handId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const { data: comments, isLoading, error } = useQuery<Comment[]>({
    queryKey: ["/api/hands", handId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/hands/${handId}/comments`, {
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
      const response = await apiRequest("POST", `/api/hands/${handId}/comments`, {
        ...commentData,
        userLevel: "Player", // Default level for now
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hands", handId, "comments"] });
      setNewComment("");
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest("POST", `/api/comments/${commentId}/like`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hands", handId, "comments"] });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim() || !isAuthenticated) return;
    
    createCommentMutation.mutate({
      content: newComment.trim(),
    });
  };

  const handleLike = (commentId: number) => {
    likeCommentMutation.mutate(commentId);
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
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">Discussion & Analysis</CardTitle>
          <Button className="bg-secondary hover:bg-secondary/90">
            <MessageSquare className="mr-2 h-4 w-4" />
            Add Comment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Comments List */}
        <div className="space-y-6 mb-8">
          {isLoading ? (
            <div className="space-y-4">
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
          ) : validComments.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet. Be the first to share your analysis!</p>
            </div>
          ) : (
            validComments.map((comment: Comment) => (
              <div key={comment.id} className="border-l-4 border-primary pl-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-sm font-semibold">
                      {comment.userName ? comment.userName.substring(0, 2).toUpperCase() : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold">{comment.userName || "Anonymous"}</span>
                      <span className="text-text-secondary text-sm">
                        {comment.createdAt ? getTimeAgo(comment.createdAt) : "Just now"}
                      </span>
                    </div>
                    <p className="text-text-primary mb-3">{comment.content || "No content"}</p>
                    <div className="flex items-center space-x-4 text-sm text-text-secondary">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(comment.id)}
                        className="p-0 h-auto text-text-secondary hover:text-primary"
                      >
                        <ThumbsUp className="mr-1 h-3 w-3" />
                        {comment.likes || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-text-secondary hover:text-primary"
                      >
                        <Reply className="mr-1 h-3 w-3" />
                        Reply
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-text-secondary hover:text-primary"
                      >
                        <Flag className="mr-1 h-3 w-3" />
                        Report
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        {isAuthenticated ? (
          <div className="pt-6 border-t border-gray-200">
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
          <div className="pt-6 border-t border-gray-200 text-center">
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
