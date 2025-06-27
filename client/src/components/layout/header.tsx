import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import logoUrl from "@/assets/tabletalk-logo.svg";
import { useAuth } from "@/hooks/useAuth";
import type { User as UserType } from "@shared/schema";

export default function Header() {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src={logoUrl} 
              alt="TableTalk Logo" 
              className="w-10 h-10"
            />
            <h1 className="text-xl font-bold text-text-primary">TableTalk</h1>
          </Link>
          
          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  {(user as UserType).profileImageUrl ? (
                    <img 
                      src={(user as UserType).profileImageUrl!} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 p-1 bg-gray-100 rounded-full" />
                  )}
                  <span className="text-sm font-medium">
                    {(user as UserType).firstName ? `${(user as UserType).firstName} ${(user as UserType).lastName || ''}`.trim() : (user as UserType).email}
                  </span>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
