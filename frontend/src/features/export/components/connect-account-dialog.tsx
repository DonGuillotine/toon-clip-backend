"use client";

import { ExternalLink, Loader, ShieldCheck } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useConnectUploadAccount } from "../mutations";
import { ConnectAccountRequestSchema } from "../schema";

/**
 * Connect an upload account. The real flow sends the user to the platform to
 * approve access and returns with a token; until platforms are decided, the
 * approval step is simulated here and the API stores the account.
 */
export function ConnectAccountDialog({
  platform,
  open,
  onOpenChange,
}: {
  readonly platform: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <ConnectAccountBody
          platform={platform}
          onDone={() => {
            onOpenChange(false);
          }}
        />
      ) : null}
    </Dialog>
  );
}

function ConnectAccountBody({
  platform,
  onDone,
}: {
  readonly platform: string;
  readonly onDone: () => void;
}) {
  const handleId = useId();
  const rightsId = useId();
  const errorId = useId();
  // A draft until submitted (AGENTS.md §3).
  const [handle, setHandle] = useState("");
  const [rights, setRights] = useState(false);
  const [touched, setTouched] = useState(false);
  const connect = useConnectUploadAccount();

  const parsed = ConnectAccountRequestSchema.safeParse({ handle, confirmedRights: rights });
  const handleError = parsed.success
    ? null
    : (parsed.error.issues.find((issue) => issue.path[0] === "handle")?.message ?? null);

  const submit = () => {
    setTouched(true);
    if (!parsed.success) return;
    connect.mutate(parsed.data, { onSuccess: onDone });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Connect {platform}</DialogTitle>
        <DialogDescription>
          {platform} asks you to approve Toon Clip, then sends you back here. Toon Clip can only
          post the videos you choose to upload.
        </DialogDescription>
      </DialogHeader>

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={handleId}>Your {platform} handle</Label>
          <Input
            id={handleId}
            value={handle}
            autoComplete="username"
            placeholder="yourname"
            aria-invalid={touched && handleError !== null}
            aria-describedby={touched && handleError !== null ? errorId : undefined}
            onChange={(event) => {
              setHandle(event.target.value);
            }}
          />
          {touched && handleError !== null ? (
            <p id={errorId} className="text-xs text-destructive-foreground">
              {handleError}
            </p>
          ) : null}
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id={rightsId}
            checked={rights}
            onCheckedChange={(value) => {
              setRights(value === true);
            }}
          />
          <Label htmlFor={rightsId} className="font-normal">
            I have the right to post the work I upload, including any references it was made from.
          </Label>
        </div>

        <p className="flex items-start gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          You can disconnect at any time. Uploads that already started will finish.
        </p>

        <DialogFooter>
          <Button type="submit" disabled={!rights || connect.isPending}>
            {connect.isPending ? (
              <>
                <Loader aria-hidden="true" className="animate-spin" /> Waiting for {platform}
              </>
            ) : (
              <>
                <ExternalLink aria-hidden="true" /> Approve on {platform}
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
