import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  Building, 
  Activity, 
  Search, 
  UserCheck, 
  UserX, 
  Edit3,
  BarChart3,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

interface AdminStats {
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
}

interface ClubsResponse {
  clubs: string[];
}

export default function Admin() {
  const [userSearch, setUserSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users", userSearch],
    queryFn: () => 
      fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('firebase-token')}`,
        },
      }).then((res) => res.json()),
  });

  // Fetch clubs
  const { data: clubsData } = useQuery<ClubsResponse>({
    queryKey: ["/api/admin/clubs"],
    queryFn: () => 
      fetch('/api/admin/clubs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('firebase-token')}`,
        },
      }).then((res) => res.json()),
  });

  // User activation/deactivation mutations
  const activateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('firebase-token')}`,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User activated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to activate user", variant: "destructive" });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('firebase-token')}`,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deactivated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to deactivate user", variant: "destructive" });
    },
  });

  const handleUserToggle = (userId: string, isActive: boolean) => {
    if (isActive) {
      deactivateUserMutation.mutate(userId);
    } else {
      activateUserMutation.mutate(userId);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card data-testid="card-stats-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-clubs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClubs || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-events">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="clubs" data-testid="tab-clubs">
            <Building className="w-4 h-4 mr-2" />
            Clubs
          </TabsTrigger>
        </TabsList>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8"
                    data-testid="input-user-search"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users?.map((user: User) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.displayName}</div>
                            {(user.firstName || user.lastName) && (
                              <div className="text-sm text-muted-foreground">
                                {user.firstName} {user.lastName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-email-${user.id}`}>
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.isActive ? "default" : "secondary"}
                            data-testid={`badge-status-${user.id}`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-created-${user.id}`}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant={user.isActive ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleUserToggle(user.id, user.isActive)}
                              disabled={activateUserMutation.isPending || deactivateUserMutation.isPending}
                              data-testid={`button-toggle-${user.id}`}
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="w-4 h-4 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clubs Management */}
        <TabsContent value="clubs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Club Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Clubs are automatically extracted from events. Below are all clubs that have hosted events.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clubsData?.clubs?.map((clubName: string, index: number) => (
                  <Card key={index} data-testid={`card-club-${index}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Building className="h-5 w-5 text-blue-600" />
                        <span className="font-medium" data-testid={`text-club-name-${index}`}>
                          {clubName}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {!clubsData?.clubs?.length && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No clubs found. Clubs will appear here when events are created.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}