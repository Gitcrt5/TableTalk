import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Home } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Club } from "@shared/schema";

interface ClubLocationValue {
  clubId?: number;
  location?: string;
  displayName?: string;
}

interface SimpleClubSelectorProps {
  value: ClubLocationValue;
  onChange: (value: ClubLocationValue) => void;
  label?: string;
}

export default function SimpleClubSelector({
  value,
  onChange,
  label = "Location"
}: SimpleClubSelectorProps) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherLocation, setOtherLocation] = useState("");

  // Get user's home club and favorites
  const { data: homeClub } = useQuery({
    queryKey: ["/api/user/clubs/home"],
    queryFn: async () => {
      const response = await apiRequest("/api/user/clubs/home");
      return response.json();
    }
  });

  const { data: favoriteClubs = [] } = useQuery({
    queryKey: ["/api/user/clubs/favorites"],
    queryFn: async () => {
      const response = await apiRequest("/api/user/clubs/favorites");
      return response.json();
    }
  });

  // Build options list
  const buildOptions = () => {
    const options = [];
    
    // Add home club first (if exists)
    if (homeClub) {
      options.push({
        value: `club-${homeClub.id}`,
        label: homeClub.name,
        icon: <Home className="h-3 w-3" />,
        club: homeClub
      });
    }
    
    // Add favorite clubs (excluding home club if already added)
    favoriteClubs.forEach((club: Club) => {
      if (!homeClub || club.id !== homeClub.id) {
        options.push({
          value: `club-${club.id}`,
          label: club.name,
          icon: <Star className="h-3 w-3" />,
          club: club
        });
      }
    });
    
    // Add "Other..." option
    options.push({
      value: "other",
      label: "Other...",
      icon: <MapPin className="h-3 w-3" />,
      club: null
    });
    
    return options;
  };

  const options = buildOptions();

  // Auto-select home club if no value is set
  useEffect(() => {
    if (homeClub && !value.clubId && !value.location) {
      console.log('Auto-selecting home club:', homeClub.name);
      onChange({
        clubId: homeClub.id,
        location: homeClub.location || undefined,
        displayName: homeClub.name
      });
    }
  }, [homeClub, value, onChange]);

  // Get current selection value for the dropdown
  const getCurrentValue = () => {
    if (value.clubId) {
      return `club-${value.clubId}`;
    }
    if (value.location && !value.clubId) {
      return "other";
    }
    return "";
  };

  const handleSelectionChange = (selectedValue: string) => {
    console.log('=== SIMPLE CLUB SELECTION ===');
    console.log('Selected value:', selectedValue);
    
    if (selectedValue === "other") {
      setShowOtherInput(true);
      onChange({
        location: otherLocation || "",
        displayName: otherLocation || ""
      });
    } else if (selectedValue.startsWith("club-")) {
      const clubId = parseInt(selectedValue.replace("club-", ""));
      const selectedClub = [...(homeClub ? [homeClub] : []), ...favoriteClubs]
        .find(club => club.id === clubId);
      
      if (selectedClub) {
        setShowOtherInput(false);
        onChange({
          clubId: selectedClub.id,
          location: selectedClub.location || undefined,
          displayName: selectedClub.name
        });
      }
    }
    
    console.log('=== SELECTION COMPLETE ===');
  };

  const handleOtherLocationChange = (newLocation: string) => {
    setOtherLocation(newLocation);
    onChange({
      location: newLocation,
      displayName: newLocation
    });
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <Select value={getCurrentValue()} onValueChange={handleSelectionChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a club or location..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showOtherInput && (
        <div className="mt-2">
          <Input
            placeholder="Enter location name..."
            value={otherLocation}
            onChange={(e) => handleOtherLocationChange(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      {/* Current selection display */}
      {value.displayName && (
        <div className="text-sm text-muted-foreground">
          Selected: {value.displayName}
        </div>
      )}
    </div>
  );
}