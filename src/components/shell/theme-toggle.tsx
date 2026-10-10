"use client";

import { useQuery } from "@tanstack/react-query";
import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUpdatePreferences } from "@/features/account/mutations";
import { accountQuery } from "@/features/account/queries";
import { applyTheme, appliedTheme } from "@/features/account/theme";

/**
 * Light or dark (spec 5, top bar). The account preference owns the theme;
 * the document follows it once the account loads, and a toggle applies at
 * once while the preference saves.
 */
export function ThemeToggle() {
  const account = useQuery(accountQuery);
  const update = useUpdatePreferences();
  const theme = account.data?.preferences.theme ?? null;

  useEffect(() => {
    if (theme !== null && theme !== appliedTheme()) applyTheme(theme);
  }, [theme]);

  const next = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? "Switch to dark theme" : "Switch to light theme";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          disabled={account.data === undefined}
          onClick={() => {
            if (!account.data) return;
            const previous = account.data.preferences.theme;
            applyTheme(next);
            update.mutate(
              { ...account.data.preferences, theme: next },
              {
                onError: () => {
                  applyTheme(previous);
                  toast.error("The theme did not save. It is back as it was.");
                },
              },
            );
          }}
        >
          {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
