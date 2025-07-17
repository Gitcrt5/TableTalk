import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailVerificationBannerProps {
  user: {
    email: string;
    firstName?: string;
    emailVerified: boolean;
  };
  onDismiss?: () => void;
}

export default function EmailVerificationBanner({ user, onDismiss }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  // Don't show if email is verified or banner is dismissed
  if (user.emailVerified || dismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await apiRequest("/api/resend-verification", {
        method: "POST",
      });
      
      if (response.ok) {
        toast({
          title: "Verification email sent",
          description: "Please check your email inbox for the verification link.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to send verification email");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send verification email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-800">Verify your email address</h3>
            <p className="text-sm text-yellow-700 mt-1">
              We sent a verification link to <strong>{user.email}</strong>. 
              Please check your email and click the link to verify your account.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend email
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-yellow-700 hover:bg-yellow-100"
              >
                <X className="h-4 w-4 mr-2" />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}