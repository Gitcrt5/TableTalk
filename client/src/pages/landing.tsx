import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to TableTalk
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The premier platform for bridge players to analyze hands, share insights, and improve their game together.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="text-lg px-8 py-4"
          >
            Sign In to Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🃏 Upload Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload PBN files from tournaments and club games to share with the community.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💬 Discuss Hands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comment on hands, share alternative lines of play, and learn from other players.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Practice Bidding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Test your bidding skills on real hands and see how you compare to the actual auction.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}