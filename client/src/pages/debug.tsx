import { useAuth } from "@/hooks/useAuth";

export default function DebugPage() {
  const { user } = useAuth();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug User Data</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Current User:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      
      <div className="mt-4 bg-blue-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">User Type Check:</h2>
        <p>User exists: {user ? 'Yes' : 'No'}</p>
        <p>User type: {user?.userType || 'undefined'}</p>
        <p>Is admin: {user?.userType === 'admin' ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}