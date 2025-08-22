import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Partnership } from "@shared/schema";

export default function Partnerships() {
  const { token } = useAuth();

  const { data: partnerships = [], isLoading } = useQuery({
    queryKey: ['/api/partnerships'],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch('/api/partnerships', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch partnerships');
      return response.json() as Promise<Partnership[]>;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Partnerships</h1>
        <p className="text-gray-600">Manage your bridge partnerships and connections</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Partners */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Partners</CardTitle>
              <Button size="sm" className="bg-bridge-green hover:bg-green-700 text-white">
                <span className="mr-2">+</span>Add Partner
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bridge-green mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading partnerships...</p>
              </div>
            ) : partnerships.length > 0 ? (
              <div className="space-y-3">
                {partnerships.map(partnership => (
                  <div key={partnership.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-bridge-green text-white flex items-center justify-center font-medium">
                        P
                      </div>
                      <div>
                        <div className="font-medium">Partner</div>
                        <div className="text-xs text-gray-500">
                          {partnership.gamesCount} games together
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-bridge-blue hover:bg-blue-700">
                        Play Together
                      </Button>
                      <Button size="sm" variant="outline">
                        Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No partnerships yet. Connect with other players to get started!</p>
                <Button className="mt-4 bg-bridge-green hover:bg-green-700 text-white">
                  Find Partners
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity with partners.</p>
                <p className="text-sm">Activity will appear here when you start playing games together.</p>
              </div>
            </div>

            <Card className="mt-6 bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Find New Partners</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Connect with other bridge players in your area or skill level.
                </p>
                <Button className="bg-bridge-blue hover:bg-blue-700">
                  Browse Players
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
