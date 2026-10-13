"use client";

import { type Adapter, WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet, WalletProvider } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { Check, ExternalLink, Loader, Wallet } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogQuery } from "@/features/catalog/queries";
import { type Prices } from "@/features/catalog/schema";
import { newIdempotencyKey } from "@/lib/api/client";
import { formatCredits } from "@/lib/format";
import {
  FAUCETS,
  formatSol,
  formatTokenAmount,
  MIN_FEE_LAMPORTS,
  shortAddress,
  SUPPORTED_NETWORK,
} from "@/lib/solana/payment";
import { cn } from "@/lib/utils";

import {
  paymentErrorCopy,
  type PayStep,
  useLinkWallet,
  useOpenPayment,
  usePay,
  useVerifyPayment,
} from "../mutations";
import { balanceQuery, sessionQuery, walletFundsQuery } from "../queries";
import { isPaid, type PaymentIntent } from "../schema";
import { type PendingPayment, usePaymentMemory, useSessionMemory } from "../stores";

/** Wallets are found through the Wallet Standard; no adapter is bundled. */
const NO_ADAPTERS: Adapter[] = [];

/** Links open in a new tab and say so. */
function ExternalAnchor({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
    >
      {children}
      <ExternalLink className="size-3" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** A notice inside the flow: one sentence of what happened and what to do. */
function Notice({
  tone = "neutral",
  children,
  action,
}: {
  readonly tone?: "neutral" | "flag" | "destructive";
  readonly children: ReactNode;
  readonly action?: ReactNode;
}) {
  return (
    <div
      role={tone === "neutral" ? undefined : "alert"}
      className={cn(
        "flex flex-col gap-3 rounded-md p-3 text-sm",
        tone === "neutral" && "bg-muted",
        tone === "flag" && "bg-flag/12 text-flag-foreground",
        tone === "destructive" && "bg-destructive/10 text-destructive-foreground",
      )}
    >
      <div className="flex flex-col gap-1">{children}</div>
      {action === undefined ? null : <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

/**
 * The whole purchase, inside its own wallet scope. Loaded only when the
 * dialog opens, so the Solana libraries never weigh on other pages.
 */
export default function BuyFlow({ onDone }: { readonly onDone: () => void }) {
  return (
    <WalletProvider wallets={NO_ADAPTERS} autoConnect localStorageKey="toonclip-wallet">
      <Flow onDone={onDone} />
    </WalletProvider>
  );
}

function Flow({ onDone }: { readonly onDone: () => void }) {
  const session = useQuery(sessionQuery);
  const balance = useQuery(balanceQuery);
  const catalog = useQuery(catalogQuery);
  const memory = useSessionMemory(session.data?.expiresAt ?? null);
  const pay = usePay();
  const [paid, setPaid] = useState<PaymentIntent | null>(null);

  if (paid !== null) return <Paid intent={paid} onDone={onDone} />;

  if (session.isPending || balance.isPending || catalog.isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <Skeleton className="h-16 rounded-md" />
        <Skeleton className="h-11 rounded-md" />
      </div>
    );
  }
  if (session.isError || balance.isError || catalog.isError) {
    return (
      <Notice
        tone="destructive"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void session.refetch();
              void balance.refetch();
              void catalog.refetch();
            }}
          >
            Try again
          </Button>
        }
      >
        <p>Your balance and prices did not load. Nothing was charged.</p>
      </Notice>
    );
  }
  const expiresAt = session.data.expiresAt;
  if (!session.data.active || expiresAt === null) {
    return (
      <Notice tone="destructive">
        <p>Your session did not start. Reload the page, then buy credits.</p>
      </Notice>
    );
  }
  if (!catalog.data.paymentsEnabled) {
    return (
      <Notice tone="flag">
        <p>Buying credits is paused right now. Try again later.</p>
      </Notice>
    );
  }
  if (balance.data.network !== SUPPORTED_NETWORK) {
    return (
      <Notice tone="flag">
        <p>Payments run on a network this app does not support yet. Try again later.</p>
      </Notice>
    );
  }

  // A sent transfer that is not credited yet always comes first, so the same
  // pack can never be paid for twice.
  if (memory.pending !== null && !pay.isPending) {
    return (
      <Pending
        pending={memory.pending}
        note={pay.isError ? paymentErrorCopy(pay.error) : null}
        onPaid={setPaid}
      />
    );
  }

  return (
    <Purchase
      prices={balance.data.prices}
      sessionExpiresAt={expiresAt}
      linkedWallet={memory.linkedWallet}
      pay={pay}
      onPaid={setPaid}
    />
  );
}

function PackSummary({ prices }: { readonly prices: Prices }) {
  const pack = prices.creditPack;
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2.5">
      <div className="flex flex-col">
        <span className="tabular text-sm font-medium">{formatCredits(pack.credits)} credits</span>
        <span className="text-xs text-muted-foreground">
          Paid on Solana Devnet with test tokens
        </span>
      </div>
      <span className="tabular text-sm font-medium">
        {pack.amount} {pack.token}
      </span>
    </div>
  );
}

function Purchase({
  prices,
  sessionExpiresAt,
  linkedWallet,
  pay,
  onPaid,
}: {
  readonly prices: Prices;
  readonly sessionExpiresAt: number;
  readonly linkedWallet: string | null;
  readonly pay: ReturnType<typeof usePay>;
  readonly onPaid: (intent: PaymentIntent) => void;
}) {
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;

  return (
    <div className="flex flex-col gap-3">
      <PackSummary prices={prices} />
      {!wallet.connected || address === null ? (
        <WalletPicker />
      ) : linkedWallet !== address ? (
        <VerifyWallet address={address} sessionExpiresAt={sessionExpiresAt} />
      ) : (
        <Pay
          address={address}
          prices={prices}
          sessionExpiresAt={sessionExpiresAt}
          pay={pay}
          onPaid={onPaid}
        />
      )}
    </div>
  );
}

function WalletIcon({ src }: { readonly src: string }) {
  return <Image src={src} alt="" width={20} height={20} unoptimized className="rounded-xs" />;
}

function WalletPicker() {
  const wallet = useWallet();
  const [error, setError] = useState<string | null>(null);
  const available = wallet.wallets.filter(
    (item) =>
      item.readyState === WalletReadyState.Installed ||
      item.readyState === WalletReadyState.Loadable,
  );

  if (available.length === 0) {
    return (
      <Notice>
        <p className="font-medium">No Solana wallet was found in this browser.</p>
        <p className="text-muted-foreground">
          Install <ExternalAnchor href="https://phantom.com/download">Phantom</ExternalAnchor> or{" "}
          <ExternalAnchor href="https://solflare.com/download">Solflare</ExternalAnchor>, switch it
          to Devnet in its developer settings, then reload this page.
        </p>
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Connect a wallet</p>
      <ul className="flex flex-col gap-1 rounded-md bg-muted p-1" aria-busy={wallet.connecting}>
        {available.map((item) => {
          const name = item.adapter.name;
          const connectingThis = wallet.connecting && wallet.wallet?.adapter.name === name;
          return (
            <li key={name}>
              <Button
                variant="ghost"
                className="h-11 w-full justify-start gap-3 px-3 text-foreground hover:bg-card"
                disabled={wallet.connecting}
                onClick={() => {
                  setError(null);
                  if (wallet.wallet?.adapter.name === name) {
                    wallet.connect().catch(() => {
                      setError(`${name} did not connect. Unlock it and try again.`);
                    });
                  } else {
                    wallet.select(name);
                  }
                }}
              >
                <WalletIcon src={item.adapter.icon} />
                <span className="flex-1 text-start">{name}</span>
                {connectingThis ? (
                  <span className="text-xs text-muted-foreground">Connecting…</span>
                ) : null}
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {error ?? "Set your wallet to Devnet first. These are test tokens with no real value."}
      </p>
    </div>
  );
}

function ConnectedAs({
  address,
  action,
}: {
  readonly address: string;
  readonly action?: ReactNode;
}) {
  const wallet = useWallet();
  return (
    <div className="flex items-center gap-2 text-sm">
      {wallet.wallet === null ? (
        <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
      ) : (
        <WalletIcon src={wallet.wallet.adapter.icon} />
      )}
      <span className="tabular min-w-0 flex-1 truncate" title={address}>
        {shortAddress(address)}
      </span>
      {action}
    </div>
  );
}

function DisconnectButton() {
  const wallet = useWallet();
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => {
        void wallet.disconnect();
      }}
    >
      Use another wallet
    </Button>
  );
}

function VerifyWallet({
  address,
  sessionExpiresAt,
}: {
  readonly address: string;
  readonly sessionExpiresAt: number;
}) {
  const wallet = useWallet();
  const link = useLinkWallet();
  const signMessage = wallet.signMessage;

  return (
    <div className="flex flex-col gap-3">
      <ConnectedAs address={address} action={<DisconnectButton />} />
      {signMessage === undefined ? (
        <Notice tone="flag">
          <p>This wallet cannot sign messages, so it cannot be verified. Use another wallet.</p>
        </Notice>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Sign a message to show this wallet is yours. Signing sends no tokens and costs nothing.
          </p>
          {link.isError ? (
            <Notice tone="destructive">
              <p>{paymentErrorCopy(link.error)}</p>
            </Notice>
          ) : null}
          <Button
            disabled={link.isPending}
            onClick={() => {
              link.mutate({ address, sessionExpiresAt, signMessage });
            }}
          >
            {link.isPending ? "Waiting for your wallet…" : "Verify wallet"}
          </Button>
        </>
      )}
    </div>
  );
}

const STEP_COPY = {
  approving: "Approve the payment in your wallet",
  confirming: "Confirming on Solana Devnet",
  verifying: "Waiting for Devnet to finalize it, about half a minute",
} satisfies Record<PayStep, string>;

const STEP_ORDER: readonly PayStep[] = ["approving", "confirming", "verifying"];

function Progress({ step }: { readonly step: PayStep }) {
  const current = STEP_ORDER.indexOf(step);
  return (
    <ol className="flex flex-col gap-1 rounded-md bg-muted p-1" aria-live="polite">
      {STEP_ORDER.map((item, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={item}
            className={cn(
              "flex h-10 items-center gap-2.5 rounded-sm px-3 text-sm",
              active ? "bg-card font-medium" : "text-muted-foreground",
            )}
          >
            {done ? (
              <Check className="size-4" aria-hidden="true" />
            ) : active ? (
              <Loader className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <span className="size-4" aria-hidden="true" />
            )}
            {STEP_COPY[item]}
            <span className="sr-only">{done ? ", done" : active ? ", in progress" : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Pay({
  address,
  prices,
  sessionExpiresAt,
  pay,
  onPaid,
}: {
  readonly address: string;
  readonly prices: Prices;
  readonly sessionExpiresAt: number;
  readonly pay: ReturnType<typeof usePay>;
  readonly onPaid: (intent: PaymentIntent) => void;
}) {
  const wallet = useWallet();
  const open = useOpenPayment();
  const [step, setStep] = useState<PayStep>("approving");
  const [openKey, setOpenKey] = useState(newIdempotencyKey);
  const pack = prices.creditPack;
  const packId = pack.id;
  const intent = open.data ?? null;
  const funds = useQuery({
    ...walletFundsQuery(address, intent?.mint ?? ""),
    enabled: intent !== null,
  });
  const { mutate: openPayment, isIdle: openIdle } = open;
  // Which payment has run past its expiry. Set by a timer, never read from
  // the clock during render.
  const [expiredAt, setExpiredAt] = useState<number | null>(null);
  const intentExpiresAt = intent?.expiresAt ?? null;
  useEffect(() => {
    if (intentExpiresAt === null) return undefined;
    const timer = setTimeout(
      () => {
        setExpiredAt(intentExpiresAt);
      },
      Math.max(0, intentExpiresAt * 1000 - Date.now()),
    );
    return () => {
      clearTimeout(timer);
    };
  }, [intentExpiresAt]);

  // Opening a payment charges nothing; it fetches where to send. The key is
  // fixed per attempt, so a repeated open returns the same payment.
  useEffect(() => {
    if (openIdle) openPayment({ packId, idempotencyKey: openKey });
  }, [openIdle, openPayment, packId, openKey]);

  if (open.isError) {
    return (
      <div className="flex flex-col gap-3">
        <ConnectedAs address={address} action={<DisconnectButton />} />
        <Notice
          tone="destructive"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                open.reset();
                setOpenKey(newIdempotencyKey());
              }}
            >
              Try again
            </Button>
          }
        >
          <p>{paymentErrorCopy(open.error)}</p>
        </Notice>
      </div>
    );
  }

  if (intent === null) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <ConnectedAs address={address} />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Preparing your payment…
        </p>
        <Skeleton className="h-9 rounded-md" />
      </div>
    );
  }

  if (intent.payer !== address) {
    return (
      <div className="flex flex-col gap-3">
        <ConnectedAs address={address} action={<DisconnectButton />} />
        <Notice tone="flag">
          <p>
            Your session is linked to another wallet ({shortAddress(intent.payer)}), and a session
            keeps one wallet. Connect that wallet to pay.
          </p>
        </Notice>
      </div>
    );
  }

  const expired = expiredAt === intent.expiresAt;
  const needed = BigInt(intent.amountAtomic);
  const shortToken = funds.data !== undefined && funds.data.tokenAtomic < needed;
  const shortSol = funds.data !== undefined && funds.data.lamports < MIN_FEE_LAMPORTS;
  const ready = funds.data !== undefined && !shortToken && !shortSol && !expired;
  const sendTransaction = wallet.sendTransaction;

  if (pay.isPending) return <Progress step={step} />;

  return (
    <div className="flex flex-col gap-3">
      <ConnectedAs address={address} action={<DisconnectButton />} />

      <dl className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1 text-sm">
        <div className="flex flex-col rounded-sm bg-card px-3 py-2">
          <dt className="text-xs text-muted-foreground">Your {pack.token}</dt>
          <dd className="tabular font-medium">
            {funds.isPending ? (
              <Skeleton className="mt-0.5 h-4 w-12" />
            ) : funds.isError ? (
              "Unknown"
            ) : (
              formatTokenAmount(funds.data.tokenAtomic, pack.decimals)
            )}
          </dd>
        </div>
        <div className="flex flex-col rounded-sm bg-card px-3 py-2">
          <dt className="text-xs text-muted-foreground">Your SOL, for the fee</dt>
          <dd className="tabular font-medium">
            {funds.isPending ? (
              <Skeleton className="mt-0.5 h-4 w-12" />
            ) : funds.isError ? (
              "Unknown"
            ) : (
              formatSol(funds.data.lamports)
            )}
          </dd>
        </div>
      </dl>

      {funds.isError ? (
        <Notice
          tone="flag"
          action={
            <Button size="sm" variant="secondary" onClick={() => void funds.refetch()}>
              Check again
            </Button>
          }
        >
          <p>Your wallet balance could not be read from Solana Devnet.</p>
        </Notice>
      ) : shortToken || shortSol ? (
        <Notice
          tone="flag"
          action={
            <Button size="sm" variant="secondary" onClick={() => void funds.refetch()}>
              Check again
            </Button>
          }
        >
          {shortToken ? (
            <p>
              You need {intent.amount} Devnet {pack.token}. Get free test {pack.token} from the{" "}
              <ExternalAnchor href={FAUCETS.usdc}>Circle faucet</ExternalAnchor>.
            </p>
          ) : null}
          {shortSol ? (
            <p>
              You need a little Devnet SOL for the network fee. Get some from the{" "}
              <ExternalAnchor href={FAUCETS.sol}>Solana faucet</ExternalAnchor>.
            </p>
          ) : null}
        </Notice>
      ) : null}

      {expired ? (
        <Notice
          tone="flag"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                open.reset();
                setOpenKey(newIdempotencyKey());
              }}
            >
              Start again
            </Button>
          }
        >
          <p>This payment expired before it was sent. Nothing was charged.</p>
        </Notice>
      ) : null}

      {pay.isError ? (
        <Notice tone="destructive">
          <p>{paymentErrorCopy(pay.error)}</p>
        </Notice>
      ) : null}

      <Button
        disabled={!ready}
        onClick={() => {
          pay.mutate(
            {
              intent,
              decimals: pack.decimals,
              token: pack.token,
              sessionExpiresAt,
              sendTransaction,
              onStep: setStep,
            },
            {
              onSuccess: (result) => {
                if (isPaid(result)) onPaid(result);
              },
            },
          );
        }}
      >
        Pay {intent.amount} {pack.token}
      </Button>
    </div>
  );
}

function Pending({
  pending,
  note,
  onPaid,
}: {
  readonly pending: PendingPayment;
  /** Why the payment stopped short, when it just did. */
  readonly note: string | null;
  readonly onPaid: (intent: PaymentIntent) => void;
}) {
  const verify = useVerifyPayment();
  const clearPending = usePaymentMemory((state) => state.clearPending);
  const explorer = `https://explorer.solana.com/tx/${encodeURIComponent(pending.signature)}?cluster=devnet`;
  const stillWaiting = verify.isSuccess && !isPaid(verify.data);

  return (
    <div className="flex flex-col gap-3">
      <Notice tone="flag">
        <p className="font-medium">
          A payment of {pending.amount} {pending.token} is waiting to be credited.
        </p>
        <p>
          It was sent for {formatCredits(pending.credits)} credits.{" "}
          {stillWaiting
            ? "Devnet has not confirmed it yet. Check again in a minute."
            : "Check it to add the credits."}{" "}
          <ExternalAnchor href={explorer}>View on Solana Explorer</ExternalAnchor>
        </p>
      </Notice>
      {verify.isError ? (
        <Notice tone="destructive">
          <p>{paymentErrorCopy(verify.error)}</p>
        </Notice>
      ) : note !== null && verify.isIdle ? (
        <p className="text-sm text-muted-foreground">{note}</p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            clearPending();
          }}
        >
          It failed in my wallet, forget it
        </Button>
        <Button
          disabled={verify.isPending}
          onClick={() => {
            verify.mutate(
              { paymentId: pending.paymentId, signature: pending.signature },
              {
                onSuccess: (intent) => {
                  if (isPaid(intent)) onPaid(intent);
                },
              },
            );
          }}
        >
          {verify.isPending ? "Checking…" : "Check payment"}
        </Button>
      </div>
    </div>
  );
}

function Paid({ intent, onDone }: { readonly intent: PaymentIntent; readonly onDone: () => void }) {
  const balance = useQuery(balanceQuery);
  return (
    <div className="flex flex-col items-start gap-3" aria-live="polite">
      <span className="grid size-10 place-items-center rounded-full bg-spot text-spot-foreground">
        <Check className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">
          {formatCredits(intent.creditsGranted)} credits added
        </p>
        <p className="text-sm text-muted-foreground">
          {balance.data === undefined
            ? "Updating your balance…"
            : `You now have ${formatCredits(balance.data.balance)} credits.`}
        </p>
      </div>
      <Button onClick={onDone}>Done</Button>
    </div>
  );
}
