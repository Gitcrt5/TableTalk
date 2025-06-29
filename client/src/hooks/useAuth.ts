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

// Check if we're using Replit auth based on environment
const isReplitAuth = import.meta.env.VITE_USE_REPLIT_AUTH !== "false";
const userEndpoint = isReplitAuth ? "/api/auth/user" : "/api/user";

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
    refetchOnMount: true, // Allow initial mount check
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData([userEndpoint], user);
      toast({
        title: "Success",
        description: "You have been logged in successfully",
      });
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
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData([userEndpoint], user);
      toast({
        title: "Success",
        description: "Your account has been created successfully",
      });
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
        await apiRequest("POST", "/api/logout");
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