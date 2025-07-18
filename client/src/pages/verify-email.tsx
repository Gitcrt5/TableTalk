import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight, Home } from "lucide-react";
import logoUrl from "@/assets/tabletalk-logo.svg";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header with logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={logoUrl} 
              alt="TableTalk Logo" 
              className="w-20 h-20"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TableTalk</h1>
          <p className="text-gray-600">Bridge Analysis Platform</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl">
              {status === 'loading' && (
                <>
                  <div className="relative">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <Mail className="h-4 w-4 absolute top-2 left-2 text-blue-600" />
                  </div>
                  <span className="text-gray-700">Verifying Your Email</span>
                </>
              )}
              {status === 'success' && (
                <>
                  <div className="relative">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <Mail className="h-4 w-4 absolute top-2 left-2 text-white" />
                  </div>
                  <span className="text-gray-700">Welcome to TableTalk!</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <XCircle className="h-8 w-8 text-red-600" />
                  <span className="text-gray-700">Verification Issue</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            {status === 'loading' && (
              <div className="space-y-3">
                <p className="text-gray-600">
                  Please wait while we verify your email address...
                </p>
                <div className="flex justify-center">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-200"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-400"></div>
                  </div>
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-green-800 font-medium mb-2">
                    <CheckCircle className="h-5 w-5" />
                    Email Successfully Verified!
                  </div>
                  <p className="text-green-700 text-sm">
                    Your account is now fully activated and ready to use.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Ready to Get Started?</h3>
                  <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                      <span>Upload PBN files to analyze bridge games</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                      <span>Review and comment on bridge hands</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                      <span>Practice bidding sequences</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                      <span>Connect with other bridge players</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Link href="/auth" className="flex-1">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Home className="h-4 w-4 mr-2" />
                      Start Playing Bridge
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-red-800 font-medium mb-2">
                    <XCircle className="h-5 w-5" />
                    Verification Failed
                  </div>
                  <p className="text-red-700 text-sm">
                    {message}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">What's Next?</h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>This verification link may have expired or already been used.</p>
                    <p>Don't worry - you can still access your account and request a new verification email.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Link href="/auth" className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Home className="h-4 w-4 mr-2" />
                        Go to Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Need help? Contact support at admin@tabletalk.cards</p>
        </div>
      </div>
    </div>
  );
}