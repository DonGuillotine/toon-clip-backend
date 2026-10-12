import { Droplet, Play } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { type Account } from "../schema";

/** The plan and what it means for exports (spec 7.7: watermark follows the plan). */
export function PlanSection({
  account,
  className,
}: {
  readonly account: Account;
  readonly className: string;
}) {
  const { plan } = account;
  return (
    <Section title="Plan" titleId="profile-plan" className={className}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-1 rounded-sm bg-card p-3">
          <span className="text-sm font-medium">{plan.name}</span>
          <span className="text-sm text-muted-foreground">{plan.summary}</span>
        </div>
        <div className="flex items-start gap-3 p-3">
          <Droplet aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-sm font-medium">
              Watermark
              <Badge variant={plan.watermark ? "flag" : "default"}>
                {plan.watermark ? "On" : "Off"}
              </Badge>
            </span>
            <span className="text-sm text-muted-foreground">
              {plan.watermark
                ? "Video exports carry a small Toon Clip mark. The export panel shows it before you export."
                : "Your exports carry no watermark."}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3">
          <Play aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-col items-start gap-2">
            <span className="text-sm text-muted-foreground">
              Walk through an example in three steps, any time.
            </span>
            <Button asChild size="sm" variant="secondary">
              <Link href="/tour">Take the tour</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
