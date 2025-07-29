import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Ban, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Fix for API request headers
const API_HEADERS = {
  'Content-Type': 'application/json',
};

interface Club {
  id: number;
  name: string;
  location: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

interface ClubFormData {
  name: string;
  location: string;
  state: string;
  country: string;
  website: string;
  email: string;
}

export default function ClubManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState<ClubFormData>({
    name: "",
    location: "",
    state: "",
    country: "",
    website: "",
    email: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clubs = [], isLoading } = useQuery({
    queryKey: ["/api/admin/clubs"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/clubs");
      return Array.isArray(response) ? response : [];
    }
  });

  const createClubMutation = useMutation({
    mutationFn: (clubData: ClubFormData) => 
      apiRequest("/api/admin/clubs", { method: "POST", body: JSON.stringify(clubData), headers: API_HEADERS }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clubs"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Club created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating club", description: error.message, variant: "destructive" });
    }
  });

  const updateClubMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClubFormData }) => 
      apiRequest(`/api/admin/clubs/${id}`, { method: "PUT", body: JSON.stringify(data), headers: API_HEADERS }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clubs"] });
      setEditingClub(null);
      resetForm();
      toast({ title: "Club updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating club", description: error.message, variant: "destructive" });
    }
  });

  const deactivateClubMutation = useMutation({
    mutationFn: (clubId: number) => 
      apiRequest(`/api/admin/clubs/${clubId}/deactivate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clubs"] });
      toast({ title: "Club deactivated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deactivating club", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      state: "",
      country: "",
      website: "",
      email: ""
    });
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      location: club.location || "",
      state: club.state || "",
      country: club.country || "",
      website: club.website || "",
      email: club.email || ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClub) {
      updateClubMutation.mutate({ id: editingClub.id, data: formData });
    } else {
      createClubMutation.mutate(formData);
    }
  };

  const filteredClubs = Array.isArray(clubs) ? clubs.filter((club: Club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.country?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  if (isLoading) {
    return <div className="text-center py-8">Loading clubs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Club Management</h2>
          <p className="text-muted-foreground">Manage bridge clubs and their information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Club
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Club</DialogTitle>
                <DialogDescription>
                  Add a new bridge club to the database
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Club Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createClubMutation.isPending}>
                    {createClubMutation.isPending ? "Creating..." : "Create Club"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search clubs by name, location, state, or country..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Clubs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(clubs) ? clubs.length : 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Clubs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(clubs) ? clubs.filter((c: Club) => c.isActive).length : 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inactive Clubs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(clubs) ? clubs.filter((c: Club) => !c.isActive).length : 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Clubs List */}
      <div className="grid gap-4">
        {filteredClubs.map((club: Club) => (
          <Card key={club.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{club.name}</h3>
                    <Badge variant={club.isActive ? "default" : "secondary"}>
                      {club.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {club.location && <div>📍 {club.location}</div>}
                    {club.state && club.country && (
                      <div>🌍 {club.state}, {club.country}</div>
                    )}
                    {club.website && (
                      <div>🌐 <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{club.website}</a></div>
                    )}
                    {club.email && (
                      <div>✉️ <a href={`mailto:${club.email}`} className="text-blue-600 hover:underline">{club.email}</a></div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={editingClub?.id === club.id} onOpenChange={(open) => !open && setEditingClub(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(club)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Club</DialogTitle>
                        <DialogDescription>
                          Update club information
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">Club Name *</Label>
                          <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-location">Location</Label>
                          <Input
                            id="edit-location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="edit-state">State</Label>
                            <Input
                              id="edit-state"
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-country">Country</Label>
                            <Input
                              id="edit-country"
                              value={formData.country}
                              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit-website">Website</Label>
                          <Input
                            id="edit-website"
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-email">Email</Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setEditingClub(null)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={updateClubMutation.isPending}>
                            {updateClubMutation.isPending ? "Updating..." : "Update Club"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  {club.isActive && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deactivateClubMutation.mutate(club.id)}
                      disabled={deactivateClubMutation.isPending}
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No clubs found matching your search.</p>
        </div>
      )}
    </div>
  );
}