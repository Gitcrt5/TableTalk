import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const [location] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Extract token from URL query parameters
      const urlParams = new URLSearchParams(location.split('?')[1]);
      const token = urlParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token found in the URL');
        return;
      }

      try {
        const response = await fetch(`/verify-email?token=${token}`, {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to verify email');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error occurred while verifying email');
      }
    };

    verifyEmail();
  }, [location]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                Verifying Email
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                Email Verified!
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                Verification Failed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {message}
          </p>
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 p-3 rounded-md">
                <Mail className="h-4 w-4" />
                <span className="text-sm">
                  Your account is now fully activated
                </span>
              </div>
              <Link href="/">
                <Button className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-red-700 bg-red-50 p-3 rounded-md">
                <p className="text-sm">
                  The verification link may have expired or is invalid.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/auth" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button className="w-full">
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="text-muted-foreground">
              <p className="text-sm">
                Please wait while we verify your email address...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}