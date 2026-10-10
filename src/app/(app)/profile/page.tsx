import { type Metadata } from "next";

import { ProfileView } from "@/features/account/components/profile-view";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account, credits, preferences and the recipes you share.
        </p>
      </header>
      <ProfileView />
    </div>
  );
}
