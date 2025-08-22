import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { authService, AUTH_CONFIG } from "@/lib/authService";
import logo from "@/assets/tabletalk-logo.svg";

export default function Auth() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError("");

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords don't match");
        }
        await authService.signUpWithEmail(email, password);
      } else {
        await authService.signInWithEmail(email, password);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!AUTH_CONFIG.google) return;
    
    setAuthLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    
    try {
      await authService.resetPassword(email);
      setError("Password reset email sent!");
    } catch (error: any) {
      setError(error.message);
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
            <img src={logo} alt="TableTalk Logo" className="w-16 h-16" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to TableTalk</CardTitle>
          <p className="text-gray-600">
            {isSignUp ? "Create your account" : "Sign in to start analyzing your bridge games"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {AUTH_CONFIG.emailPassword && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
              
              {isSignUp && AUTH_CONFIG.registration && (
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  data-testid="input-confirm-password"
                />
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={authLoading}
                data-testid="button-submit"
              >
                {authLoading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
              </Button>
            </form>
          )}

          {AUTH_CONFIG.google && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 px-2 text-gray-500">Or</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                className="w-full"
                disabled={authLoading}
                data-testid="button-google"
              >
                Continue with Google
              </Button>
            </>
          )}

          {error && (
            <p className={`text-sm text-center ${error.includes("sent") ? "text-green-600" : "text-red-600"}`}>
              {error}
            </p>
          )}

          <div className="text-center space-y-2">
            {AUTH_CONFIG.registration && (
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-gray-600 hover:text-gray-900"
                data-testid="button-toggle-signup"
              >
                {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
              </button>
            )}

            {AUTH_CONFIG.passwordReset && !isSignUp && (
              <button
                type="button"
                onClick={handlePasswordReset}
                className="block w-full text-sm text-gray-600 hover:text-gray-900"
                data-testid="button-reset-password"
              >
                Forgot password?
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
