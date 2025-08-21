import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, handleRedirectResult, onAuthStateChanged } from "./firebase";
import { User as FirebaseUser } from "firebase/auth";
import { User } from "@shared/schema";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  loading: true,
  token: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  console.log("AuthProvider initialized");

  useEffect(() => {
    console.log("AuthProvider useEffect starting...");
    // No need to handle redirect result for popup-based auth
    console.log("Using popup-based authentication (no redirect handling needed)");

    // Set up auth state listener
    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed. Firebase user:", firebaseUser ? firebaseUser.uid : "null");
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          console.log("Firebase user authenticated:", firebaseUser.uid);
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          console.log("Got Firebase token, sending to backend...");

          // Fetch user data from our backend
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          console.log("Backend response status:", response.status);

          if (response.ok) {
            const userData = await response.json();
            console.log("Successfully authenticated user:", userData);
            setUser(userData);
          } else {
            const errorData = await response.json();
            console.error("CRITICAL: Backend authentication failed:", response.status, errorData);
            console.error("This means Firebase token verification failed on server");
          }
        } catch (error) {
          console.error("Error during authentication process:", error);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
};
