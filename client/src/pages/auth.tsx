import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/firebase";
import { SuitSymbol } from "@/components/bridge/SuitSymbol";
import logo from "@/assets/tabletalk-logo.svg";

export default function Auth() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleSignIn = async () => {
    console.log("Sign in button clicked");
    try {
      console.log("Calling signInWithGoogle (popup mode)...");
      const result = await signInWithGoogle();
      console.log("Google sign-in successful:", result.user.uid);
    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("User closed the popup");
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log("Popup was cancelled");
      } else {
        console.error("Sign-in error:", error.code, error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bridge-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logo} 
              alt="TableTalk Logo" 
              className="w-16 h-16" 
            />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to TableTalk</CardTitle>
          <p className="text-gray-600">Sign in to start analyzing your bridge games</p>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignIn} className="w-full" size="lg">
            Sign in with Google
          </Button>
          <p className="text-xs text-gray-500 text-center mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
