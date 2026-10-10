import { comicPagesFixture } from "@/features/comics/mocks";
import {
  advanceComicExport,
  applyComicAction,
  completePanel,
  type ComicExportRecord,
  exportBlocker,
  exportFileName,
  newPage,
  type PageResult,
  panelJobStatus,
  progressPanel,
  queuePanel,
  selectedTake,
  summariseExport,
  summarisePage,
} from "@/features/comics/page";
import {
  type ComicAction,
  type ComicExport,
  type ComicExportRequest,
  type ComicPage,
  type ComicSummary,
  type CreateComicRequest,
  type PanelTake,
} from "@/features/comics/schema";
import { type CoverArt } from "@/features/storyboards/schema";

/**
 * The in-memory stand-in for the comics API. Only route handlers import this
 * file; when the backend lands, the handlers proxy to it and this file is
 * deleted. State lives on `globalThis` so every route bundle shares it.
 */

/** Fixture price per panel. Only the API knows prices. */
const CREDITS_PER_PANEL = 40;
/** Every fourth generation fails, so the failed state and retry get exercised. */
const FAIL_EVERY = 4;

type PanelJob = {
  readonly pageId: string;
  readonly panelId: string;
  readonly startedAt: number;
  readonly prompt: string;
  readonly fails: boolean;
  settled: boolean;
};

type Store = {
  readonly pages: Map<string, ComicPage>;
  readonly jobs: Map<string, PanelJob>;
  readonly exports: Map<string, ComicExportRecord>;
  counter: number;
  generations: number;
};

const scope: typeof globalThis & { toonClipComicStore?: Store } = globalThis;

function store(): Store {
  scope.toonClipComicStore ??= {
    pages: new Map(comicPagesFixture.map((page) => [page.id, page])),
    jobs: new Map(),
    exports: new Map(),
    counter: 0,
    generations: 0,
  };
  return scope.toonClipComicStore;
}

function newId(prefix: string): string {
  const s = store();
  s.counter += 1;
  return `${prefix}_${Date.now().toString(36)}${String(s.counter)}`;
}

const ARTS: readonly CoverArt[] = ["burst", "rush", "dusk", "rain"];

/** Advance every job and export on a page to where the clock says it is. */
function tick(pageId: string, now: number): ComicPage | undefined {
  const s = store();
  let page = s.pages.get(pageId);
  if (!page) return undefined;

  for (const [jobId, job] of s.jobs) {
    if (job.settled || job.pageId !== pageId) continue;
    const status = panelJobStatus(job.startedAt, now);
    if (status.status === "generating") {
      page = progressPanel(page, job.panelId, jobId, status.progress);
    } else if (status.status === "done") {
      const panel = page.panels.find((item) => item.id === job.panelId);
      const number = (panel?.takes.length ?? 0) + 1;
      const take: PanelTake = {
        id: `${job.panelId}_t${String(number)}_${jobId.slice(-4)}`,
        number,
        prompt: job.prompt,
        credits: CREDITS_PER_PANEL,
        createdAt: new Date(now).toISOString(),
        art: ARTS[(number + job.panelId.length) % ARTS.length] ?? "burst",
      };
      page = completePanel(
        page,
        job.panelId,
        jobId,
        job.fails
          ? {
              ok: false,
              reason: `The model timed out on this panel. Your ${String(CREDITS_PER_PANEL)} credits were refunded. Try again.`,
            }
          : { ok: true, take },
      );
      job.settled = true;
    }
  }

  const exports: ComicExport[] = [];
  for (const record of s.exports.values()) {
    if (record.pageId === pageId) exports.push(advanceComicExport(record, now));
  }
  exports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  page = { ...page, exports };
  s.pages.set(pageId, page);
  return page;
}

export function listPages(now = Date.now()): ComicSummary[] {
  const pages: ComicPage[] = [];
  for (const id of store().pages.keys()) {
    const page = tick(id, now);
    if (page) pages.push(page);
  }
  return pages
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((page) => summarisePage(page));
}

export function getPage(id: string, now = Date.now()): ComicPage | undefined {
  return tick(id, now);
}

export function createPage(input: CreateComicRequest): ComicPage {
  const id = newId("cp");
  const page = newPage(
    id,
    input.title,
    input.layout,
    new Date(),
    (index) => `${id}_p${String(index + 1)}`,
  );
  store().pages.set(id, page);
  return page;
}

export function deletePage(id: string): boolean {
  const s = store();
  for (const [exportId, record] of s.exports) {
    if (record.pageId === id) s.exports.delete(exportId);
  }
  return s.pages.delete(id);
}

function commit(id: string, result: PageResult): PageResult {
  if (!result.ok) return result;
  const page = { ...result.page, updatedAt: new Date().toISOString() };
  store().pages.set(id, page);
  return { ok: true, page };
}

export function act(id: string, action: ComicAction): PageResult | undefined {
  const page = tick(id, Date.now());
  if (!page) return undefined;
  return commit(id, applyComicAction(page, action));
}

/** The fixture price list. `undefined` is an unknown page or panel. */
export function quotePanel(id: string, panelId: string): number | undefined {
  const page = getPage(id);
  return page?.panels.some((panel) => panel.id === panelId) ? CREDITS_PER_PANEL : undefined;
}

/** Queue a generation (first take, another take, or a retry after a failure). */
export function generatePanel(id: string, panelId: string): PageResult | undefined {
  const s = store();
  const page = tick(id, Date.now());
  if (!page) return undefined;
  const jobId = newId("cjob");
  const result = commit(id, queuePanel(page, panelId, jobId));
  if (!result.ok) return result;
  s.generations += 1;
  const panel = result.page.panels.find((item) => item.id === panelId);
  s.jobs.set(jobId, {
    pageId: id,
    panelId,
    startedAt: Date.now(),
    prompt: panel?.prompt ?? "",
    fails: s.generations % FAIL_EVERY === 0,
    settled: false,
  });
  return result;
}

export function startExport(id: string, request: ComicExportRequest): ComicExport | undefined {
  const page = tick(id, Date.now());
  if (!page) return undefined;
  const record: ComicExportRecord = {
    id: newId("cex"),
    pageId: id,
    format: request.format,
    summary: summariseExport(request),
    fileName: exportFileName(page.title, request.format),
    startedAt: Date.now(),
    failWith: exportBlocker(page),
  };
  store().exports.set(record.id, record);
  return advanceComicExport(record, Date.now());
}

/** Retry a failed export. The blocker is checked again against the page as it is now. */
export function retryExport(id: string, exportId: string): ComicExport | undefined {
  const s = store();
  const record = s.exports.get(exportId);
  const page = tick(id, Date.now());
  if (record?.pageId !== id || !page) return undefined;
  const next: ComicExportRecord = {
    ...record,
    startedAt: Date.now(),
    failWith: exportBlocker(page),
  };
  s.exports.set(exportId, next);
  return advanceComicExport(next, Date.now());
}

export type ExportDownload = { readonly fileName: string; readonly body: string };

/**
 * Stands in for the rendered file: a plain-text manifest of the layers or
 * lettering the real export would contain. `undefined` until the job is ready.
 */
export function exportDownload(id: string, exportId: string): ExportDownload | undefined {
  const record = store().exports.get(exportId);
  const page = tick(id, Date.now());
  if (record?.pageId !== id || !page) return undefined;
  const job = advanceComicExport(record, Date.now());
  if (job.status !== "ready") return undefined;

  const lines = [
    "Toon Clip sample export",
    "This manifest stands in for the rendered file until the export service lands.",
    "",
    `Page: ${page.title}`,
    `File: ${job.fileName}`,
    `Options: ${job.summary}`,
    "",
  ];
  page.panels.forEach((panel, index) => {
    const number = String(index + 1);
    const take = selectedTake(panel);
    lines.push(`Panel ${number}${record.format === "psd" ? ` (folder P${number})` : ""}`);
    lines.push(`  Take: ${take ? `take ${String(take.number)}` : "none"}`);
    if (record.format === "psd") {
      lines.push(`  Layer: P${number}_background (locked)`, `  Layer: P${number}_character`);
    }
    for (const bubble of panel.bubbles) {
      lines.push(`  ${bubble.kind}: ${bubble.text}`);
    }
  });
  return { fileName: `${job.fileName}.txt`, body: lines.join("\n") };
}
