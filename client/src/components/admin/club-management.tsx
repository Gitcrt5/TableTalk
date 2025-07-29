import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Search, Globe, Mail, MapPin, Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Club {
  id: number;
  name: string;
  location?: string;
  state?: string;
  country?: string;
  website?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  userCount?: number; // Number of users who have this as home club
}

export default function ClubManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    state: "",
    country: "",
    website: "",
    email: "",
  });
  const { toast } = useToast();

  const { data: clubs = [], isLoading, error } = useQuery<Club[]>({
    queryKey: ["/api/admin/clubs"],
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (clubData: typeof formData) => {
      const response = await apiRequest("/api/admin/clubs", {
        method: "POST",
        body: JSON.stringify(clubData),
      });
      if (!response.ok) throw new Error("Failed to create club");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Club created",
        description: "The club has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clubs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create club",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...clubData }: typeof formData & { id: number }) => {
      const response = await apiRequest(`/api/admin/clubs/${id}`, {
        method: "PUT",
        body: JSON.stringify(clubData),
      });
      if (!response.ok) throw new Error("Failed to update club");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Club updated",
        description: "The club has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clubs"] });
      setShowEditDialog(false);
      resetForm();
      setSelectedClub(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update club",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (clubId: number) => {
      const response = await apiRequest(`/api/admin/clubs/${clubId}/deactivate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to deactivate club");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Club deactivated",
        description: "The club has been successfully deactivated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clubs"] });
      setShowDeactivateDialog(false);
      setSelectedClub(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate club",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      state: "",
      country: "",
      website: "",
      email: "",
    });
  };

  const handleAdd = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleEdit = (club: Club) => {
    setSelectedClub(club);
    setFormData({
      name: club.name,
      location: club.location || "",
      state: club.state || "",
      country: club.country || "",
      website: club.website || "",
      email: club.email || "",
    });
    setShowEditDialog(true);
  };

  const handleDeactivate = (club: Club) => {
    setSelectedClub(club);
    setShowDeactivateDialog(true);
  };

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (club.location && club.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (club.state && club.state.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (club.country && club.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load clubs. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Club Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleAdd} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Club
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading clubs...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>State/Country</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClubs.map((club) => (
                    <TableRow key={club.id}>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell>
                        {club.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {club.location}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {club.state && club.country ? `${club.state}, ${club.country}` : club.country}
                      </TableCell>
                      <TableCell>
                        {club.website && (
                          <a 
                            href={club.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            Visit
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={club.isActive ? "default" : "secondary"}>
                          {club.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{club.userCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(club)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {club.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivate(club)}
                            >
                              <PowerOff className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredClubs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No clubs found matching your search." : "No clubs found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Club Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Club</DialogTitle>
            <DialogDescription>
              Create a new bridge club. Only the name is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Club Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter club name"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City or suburb"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State or province"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@club.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Club"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Club Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>
              Update club information. Only the name is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Club Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter club name"
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City or suburb"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-state">State/Province</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State or province"
                />
              </div>
              <div>
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@club.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedClub && updateMutation.mutate({ id: selectedClub.id, ...formData })}
              disabled={!formData.name.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Update Club"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Club Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Club</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate "{selectedClub?.name}"? 
              This will remove it from selection lists but preserve existing user relationships.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedClub && deactivateMutation.mutate(selectedClub.id)}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}