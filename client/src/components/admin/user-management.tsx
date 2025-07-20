import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserX, UserCheck, Search, Calendar, Mail, Shield, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: string;
  userType: string;
  authType: string;
  emailVerified: boolean;
  isActive: boolean;
  deactivatedAt?: string;
  createdAt: string;
}

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState("");
  const { toast } = useToast();

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const deactivateMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const response = await apiRequest(`/api/admin/users/${userId}/deactivate`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to deactivate user");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User deactivated",
        description: "The user has been successfully deactivated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowDeactivateDialog(false);
      setDeactivationReason("");
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate user",
        variant: "destructive",
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/admin/users/${userId}/reactivate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reactivate user");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User reactivated",
        description: "The user has been successfully reactivated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowReactivateDialog(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reactivate user",
        variant: "destructive",
      });
    },
  });

  const updateUserTypeMutation = useMutation({
    mutationFn: async ({ userId, userType }: { userId: string; userType: string }) => {
      const response = await apiRequest(`/api/admin/users/${userId}/user-type`, {
        method: "POST",
        body: JSON.stringify({ userType }),
      });
      if (!response.ok) throw new Error("Failed to update user type");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User type updated",
        description: "The user type has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user type",
        variant: "destructive",
      });
    },
  });

  const cleanupTestDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/admin/cleanup-test-data`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to cleanup test data");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test data cleanup completed",
        description: `Deleted ${data.results.deletedUsers} test users, ${data.results.deletedGames} games, ${data.results.deletedHands} hands, and ${data.results.deletedComments} comments.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowCleanupDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cleanup test data",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.displayName.toLowerCase().includes(query)
    );
  });

  const handleDeactivate = (user: User) => {
    setSelectedUser(user);
    setShowDeactivateDialog(true);
  };

  const handleReactivate = (user: User) => {
    setSelectedUser(user);
    setShowReactivateDialog(true);
  };

  const confirmDeactivate = () => {
    if (!selectedUser) return;
    deactivateMutation.mutate({
      userId: selectedUser.id,
      reason: deactivationReason,
    });
  };

  const confirmReactivate = () => {
    if (!selectedUser) return;
    reactivateMutation.mutate(selectedUser.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "test":
        return "bg-orange-100 text-orange-800";
      case "player":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUserTypeChange = (user: User, newUserType: string) => {
    updateUserTypeMutation.mutate({
      userId: user.id,
      userType: newUserType,
    });
  };

  const handleCleanupTestData = () => {
    setShowCleanupDialog(true);
  };

  const confirmCleanupTestData = () => {
    cleanupTestDataMutation.mutate();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "teacher":
        return "bg-blue-100 text-blue-800";
      case "player":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load users. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Management
            </CardTitle>
            <Button
              variant="outline"
              onClick={handleCleanupTestData}
              disabled={cleanupTestDataMutation.isPending}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {cleanupTestDataMutation.isPending ? "Cleaning..." : "Clean Test Data"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or display name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>User Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{user.displayName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{user.email}</span>
                          {user.emailVerified && (
                            <Badge variant="outline" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getRoleBadgeColor(user.role)}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getUserTypeBadgeColor(user.userType)}
                        >
                          {user.userType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              user.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className="text-sm">
                            {user.isActive ? "Active" : "Deactivated"}
                          </span>
                        </div>
                        {user.deactivatedAt && (
                          <div className="text-xs text-muted-foreground">
                            Deactivated: {formatDate(user.deactivatedAt)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(user.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={user.userType}
                            onValueChange={(value) => handleUserTypeChange(user, value)}
                            disabled={updateUserTypeMutation.isPending}
                          >
                            <SelectTrigger className="w-20 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="player">Player</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="test">Test</SelectItem>
                            </SelectContent>
                          </Select>
                          {user.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivate(user)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivate(user)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No users found matching your search." : "No users found."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deactivate Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>
              ? This will prevent them from logging in, but their data will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for deactivation (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for deactivation..."
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeactivateDialog(false)}
              disabled={deactivateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeactivate}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? "Deactivating..." : "Deactivate User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate User</DialogTitle>
            <DialogDescription>
              Are you sure you want to reactivate{" "}
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>
              ? This will allow them to log in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReactivateDialog(false)}
              disabled={reactivateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReactivate}
              disabled={reactivateMutation.isPending}
            >
              {reactivateMutation.isPending ? "Reactivating..." : "Reactivate User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Test Data Dialog */}
      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clean Test Data</DialogTitle>
            <DialogDescription>
              This will permanently delete all test users and their associated data, including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All users with user type "test"</li>
                <li>All games uploaded by test users</li>
                <li>All hands from those games</li>
                <li>All comments made by test users or on test games</li>
              </ul>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCleanupDialog(false)}
              disabled={cleanupTestDataMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCleanupTestData}
              disabled={cleanupTestDataMutation.isPending}
            >
              {cleanupTestDataMutation.isPending ? "Cleaning..." : "Clean Test Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}