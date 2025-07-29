import { useState } from "react";
import { ProfileManagement } from "@/components/account/profile-management";
import { PasswordManagement } from "@/components/account/password-management";

import { PartnerManagement } from "@/components/account/partner-management";
import ClubManagement from "@/components/account/club-management";
import { useAuth } from "@/hooks/useAuth";

export default function AccountPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "partners" | "clubs">("profile");

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings, partners, and preferences.
          </p>
        </div>

        <div className="flex space-x-8 border-b">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "password"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setActiveTab("partners")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "partners"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Partners
          </button>
          <button
            onClick={() => setActiveTab("clubs")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "clubs"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Clubs
          </button>
        </div>

        <div className="mt-8">
          {/* Tab Content */}
          {activeTab === "profile" && <ProfileManagement />}
          {activeTab === "password" && <PasswordManagement />}
          {activeTab === "partners" && <PartnerManagement />}
          {activeTab === "clubs" && <ClubManagement />}
        </div>
      </div>
    </div>
  );
}