"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Section } from "@/components/section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiErrorDetail } from "@/lib/api/client";

import { useUpdateProfile } from "../mutations";
import { type Account, type ProfileUpdate, ProfileUpdateSchema } from "../schema";
import { FormField } from "./form-field";

/** Display name and handle, edited in place and saved through the API. */
export function AccountDetailsForm({
  account,
  className,
}: {
  readonly account: Account;
  readonly className: string;
}) {
  const update = useUpdateProfile();
  const form = useForm<ProfileUpdate>({
    resolver: zodResolver(ProfileUpdateSchema),
    values: { displayName: account.displayName, handle: account.handle },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    update.mutate(values, {
      onSuccess: (next) => {
        form.reset({ displayName: next.displayName, handle: next.handle });
        toast("Profile saved.");
      },
      onError: (error) => {
        // A 409 is the one refusal about a field: the handle is taken.
        const detail = apiErrorDetail(error);
        if (error instanceof ApiError && error.status === 409 && detail !== null) {
          form.setError("handle", { message: detail });
          return;
        }
        toast.error("Your profile did not save. Your edits are still here; try again.");
      },
    });
  });

  return (
    <Section
      title="Account"
      titleId="profile-account"
      description="How other creators see you."
      className={className}
      well={false}
    >
      <form
        noValidate
        className="flex flex-col gap-4 rounded-md bg-muted p-4"
        onSubmit={(event) => {
          void onSubmit(event);
        }}
      >
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-spot text-lg font-semibold text-spot-foreground">
              {account.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{account.displayName}</span>
            <span className="truncate text-sm text-muted-foreground">{account.email}</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Display name" error={errors.displayName?.message}>
            {(props) => (
              <Input {...props} autoComplete="nickname" {...form.register("displayName")} />
            )}
          </FormField>
          <FormField
            label="Handle"
            hint="Lowercase letters, numbers and underscores."
            error={errors.handle?.message}
          >
            {(props) => (
              <Input
                {...props}
                autoComplete="username"
                spellCheck={false}
                {...form.register("handle")}
              />
            )}
          </FormField>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!isDirty || update.isPending}
            onClick={() => {
              form.reset();
            }}
          >
            Discard
          </Button>
          <Button type="submit" disabled={!isDirty || update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Section>
  );
}
