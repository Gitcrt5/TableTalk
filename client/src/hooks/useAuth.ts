import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
};

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  authType: string;
  userType: string;
  emailVerified: boolean;
};

// Always use local auth - hardcoded to avoid confusion
const isReplitAuth = false;
const userEndpoint = "/api/user";

export function useAuth() {
  const { toast } = useToast();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: [userEndpoint],
    queryFn: async () => {
      try {
        const res = await fetch(userEndpoint, {
          credentials: 'include',
        });
        if (res.status === 401) {
          return null; // User not authenticated, return null instead of throwing
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        // For network errors or other issues, return null to show auth page
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnReconnect: false,
    refetchInterval: false, // Never automatically refetch
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes to prevent frequent requests
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData([userEndpoint], user);
      // Don't invalidate to prevent immediate refetch after login
      toast({
        title: "Success",
        description: "You have been logged in successfully",
      });
      // Ensure we navigate to dashboard after login
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData([userEndpoint], user);
      toast({
        title: "Welcome to TableTalk!",
        description: "Your account has been created successfully. You can now upload and analyze bridge games.",
      });
      // Ensure we navigate to dashboard after registration
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (isReplitAuth) {
        // For Replit auth, navigate to logout URL
        window.location.href = "/api/logout";
      } else {
        // For local auth, call logout API
        await apiRequest("/api/logout", {
          method: "POST",
        });
      }
    },
    onSuccess: () => {
      if (!isReplitAuth) {
        queryClient.setQueryData([userEndpoint], null);
        toast({
          title: "Success",
          description: "You have been logged out",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logoutMutation,
  };
}