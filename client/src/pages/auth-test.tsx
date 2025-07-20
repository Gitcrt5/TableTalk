import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AuthTestPage() {
  const [authState, setAuthState] = useState<any>(null);
  const [loginResult, setLoginResult] = useState<any>(null);

  const testLogin = async () => {
    try {
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: "admin@tabletalk.cards",
          password: "admin123"
        })
      });
      
      const loginData = await loginRes.json();
      setLoginResult({ status: loginRes.status, data: loginData });
      
      // Immediately test auth after login
      const authRes = await fetch("/api/user", {
        credentials: "include"
      });
      
      if (authRes.ok) {
        const userData = await authRes.json();
        setAuthState({ status: authRes.status, data: userData });
      } else {
        setAuthState({ status: authRes.status, error: "Auth failed" });
      }
    } catch (error) {
      setAuthState({ error: error.message });
    }
  };

  const testAuth = async () => {
    try {
      const res = await fetch("/api/user", {
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        setAuthState({ status: res.status, data });
      } else {
        setAuthState({ status: res.status, error: "Not authenticated" });
      }
    } catch (error) {
      setAuthState({ error: error.message });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="space-y-4">
        <Button onClick={testLogin}>Test Login + Auth</Button>
        <Button onClick={testAuth}>Test Auth Only</Button>
        
        {loginResult && (
          <div className="bg-blue-100 p-4 rounded">
            <h2 className="font-semibold">Login Result:</h2>
            <pre className="text-sm">{JSON.stringify(loginResult, null, 2)}</pre>
          </div>
        )}
        
        {authState && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold">Auth State:</h2>
            <pre className="text-sm">{JSON.stringify(authState, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}