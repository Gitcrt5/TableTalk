import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Shield, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { User as UserType } from "@shared/schema";
import tabletalkLogo from "@/assets/tabletalk-logo.svg";

export default function Header() {
  const { user, isAuthenticated, logoutMutation } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <img src={tabletalkLogo} alt="TableTalk Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">TableTalk</h1>
              <p className="text-xs text-text-secondary hidden sm:block">Upload and review bridge games with bidding analysis</p>
            </div>
          </Link>
          
          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 hover:text-gray-900">
                      {(user as UserType).profileImageUrl ? (
                        <img 
                          src={(user as UserType).profileImageUrl!} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 p-1 bg-gray-100 rounded-full" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {(user as UserType).displayName || (user as UserType).firstName ? `${(user as UserType).firstName} ${(user as UserType).lastName || ''}`.trim() : (user as UserType).email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="flex items-center cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    {user && (user as any).userType === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center cursor-pointer">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="mailto:admin@tabletalk.cards" className="flex items-center cursor-pointer">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Help & Support
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                      className="cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
