"use client";

import "./globals.css";

/**
 * Catches a crash in the root layout itself, so it rebuilds the document and
 * cannot rely on the layout's fonts or providers.
 */
export default function GlobalError({ retry }: { readonly retry: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-paper p-6 font-sans text-ink">
        <div className="flex max-w-md flex-col items-start gap-4 border-3 border-ink bg-sheet p-8">
          <h1 className="text-2xl font-black">Toon Clip hit a snag.</h1>
          <p>Nothing you made is lost. Reload to pick up where you were.</p>
          {/* eslint-disable-next-line no-restricted-syntax -- the kit cannot load when the root layout has crashed */}
          <button
            type="button"
            onClick={retry}
            className="rounded-md border-2 border-ink bg-spot px-4 py-2 font-bold"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
