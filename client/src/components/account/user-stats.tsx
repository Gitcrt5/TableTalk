import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserStats() {
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  if (!userStats) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Games Uploaded</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.gamesUploaded}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Hands Reviewed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.handsReviewed}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Comments Made</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.commentsMade}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Bidding Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {userStats.averageBiddingAccuracy > 0 
              ? `${Math.round(userStats.averageBiddingAccuracy)}%`
              : "N/A"
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}