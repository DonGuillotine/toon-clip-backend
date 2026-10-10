import { type Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/section";
import { Logo } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { ClearSession } from "@/features/account/components/clear-session";

export const metadata: Metadata = { title: "Signed out" };

/**
 * Outside the app shell: no rail, no dock. CONTRACT: unconfirmed. Accounts
 * and sessions are the backend's; until then, signing out clears what this
 * browser holds (cached data and session attachments).
 */
export default function SignedOutPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <ClearSession />
      <Card className="flex w-full max-w-md flex-col items-start gap-6 p-6 sm:p-8">
        <Logo />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">You are signed out.</h1>
          <p className="text-muted-foreground">
            Your storyboards, takes and credits are saved to your account and will be here when you
            come back.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/">Sign back in</Link>
        </Button>
      </Card>
    </main>
  );
}
