import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/firebase";
import { SuitSymbol } from "@/components/bridge/SuitSymbol";

export default function Auth() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleSignIn = () => {
    signInWithGoogle();
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
            <div className="w-16 h-16 rounded-lg bg-bridge-green flex items-center justify-center">
              <div className="text-white text-lg">
                <SuitSymbol suit="S" className="text-white" />
                <SuitSymbol suit="H" className="text-red-300" />
                <SuitSymbol suit="D" className="text-red-300" />
                <SuitSymbol suit="C" className="text-white" />
              </div>
            </div>
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
