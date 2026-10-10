"use client";

import "./globals.css";

/**
 * Catches a crash in the root layout itself, so it rebuilds the document and
 * cannot rely on the layout's fonts or providers.
 */
export default function GlobalError({ retry }: { readonly retry: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-canvas p-6 font-sans text-foreground">
        <div className="flex max-w-md flex-col items-start gap-4 rounded-xl bg-card p-8">
          <h1 className="text-xl font-semibold tracking-tight">Toon Clip hit a snag.</h1>
          <p className="text-muted-foreground">
            Nothing you made is lost. Reload to pick up where you were.
          </p>
          {/* eslint-disable-next-line no-restricted-syntax -- the kit cannot load when the root layout has crashed */}
          <button
            type="button"
            onClick={retry}
            className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
