import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { authService } from "@/lib/authService";
import logo from "@/assets/tabletalk-logo.svg";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const AppHeader = () => {
  const { user, firebaseUser, loading } = useAuth();

  const handleSignIn = () => {
    authService.signInWithGoogle();
  };

  const handleSignOut = () => {
    authService.signOut();
  };

  // Define logout function to be used in DropdownMenuItem
  const logout = () => {
    handleSignOut();
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* SidebarTrigger is now a separate component on the left */}
            <SidebarTrigger className="-ml-1 md:hidden" />
            <Link href="/" data-testid="link-home">
              <div className="flex items-center gap-3 cursor-pointer">
                <img 
                  src={logo} 
                  alt="TableTalk Logo" 
                  className="w-10 h-10" 
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TableTalk</h1>
                  <p className="text-xs text-gray-500">Bridge Analysis Platform</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-bridge-green text-white flex items-center justify-center text-sm font-medium">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{user.displayName || user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut} data-testid="button-sign-out">
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={handleSignIn} data-testid="button-sign-in">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};