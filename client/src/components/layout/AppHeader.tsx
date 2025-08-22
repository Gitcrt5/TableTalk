import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { signInWithGoogle, signOutUser } from "@/lib/firebase";
import { SuitSymbol } from "@/components/bridge/SuitSymbol";
import logo from "@/assets/tabletalk-logo.svg";

export const AppHeader = () => {
  const { user, firebaseUser, loading } = useAuth();

  const handleSignIn = () => {
    signInWithGoogle();
  };

  const handleSignOut = () => {
    signOutUser();
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/">
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

          {user && (
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-bridge-green transition-colors">Dashboard</Link>
              <Link href="/my-games" className="text-gray-600 hover:text-bridge-green transition-colors">My Games</Link>
              <Link href="/events" className="text-gray-600 hover:text-bridge-green transition-colors">Events</Link>
              <Link href="/partnerships" className="text-gray-600 hover:text-bridge-green transition-colors">Partnerships</Link>
              <Link href="/explore" className="text-gray-600 hover:text-bridge-green transition-colors">Discover</Link>
            </nav>
          )}

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-bridge-green text-white flex items-center justify-center text-sm font-medium">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                  <span className="text-sm font-medium">{user.displayName || user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={handleSignIn}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
