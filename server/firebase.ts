import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export interface DecodedToken {
  uid: string;
  email?: string;
  name?: string;
}

// Initialize Firebase Admin SDK
let adminApp: App;
try {
  // Check if an app is already initialized
  if (getApps().length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required");
    }

    const serviceAccount = JSON.parse(serviceAccountKey);
    
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    
    console.log("Firebase Admin SDK initialized successfully");
  } else {
    adminApp = getApps()[0];
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK:", error instanceof Error ? error.message : error);
  throw new Error("Firebase Admin SDK initialization failed");
}

// Production-ready Firebase token verification using Admin SDK
export async function verifyFirebaseToken(token: string): Promise<DecodedToken> {
  if (!token) {
    throw new Error("No token provided");
  }

  try {
    // Use Firebase Admin SDK to verify the ID token
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.display_name,
    };
  } catch (error: any) {
    console.error("Firebase token verification failed:", error);
    
    // Provide specific error messages for different scenarios
    if (error?.code === 'auth/id-token-expired') {
      throw new Error("Token has expired");
    } else if (error?.code === 'auth/id-token-revoked') {
      throw new Error("Token has been revoked");
    } else if (error?.code === 'auth/invalid-id-token') {
      throw new Error("Invalid token format");
    } else if (error?.code === 'auth/project-not-found') {
      throw new Error("Firebase project not found");
    } else {
      throw new Error(`Token verification failed: ${error?.message || 'Unknown error'}`);
    }
  }
}
