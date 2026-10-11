# Toon Clip backend

The first working slice is a Python/FastAPI API with SQLite persistence. It serves prepared demo content and saves projects, shot flags/locks, take history, and export snapshots. No UI or AI integration is included.

Solana Devnet credit purchases, wallet ownership checks, credit balances, and charges are implemented. Users buy 100 credits for 10 test USDC, then spend credits to create, revise, and export. The default catalogue is empty because real media has not been supplied. `/health` reports `demoReady: false` until scenarios are configured.

| Action | Demo price |
| --- | --- |
| Buy 100 credits | 10 test USDC |
| Create a clip | 10 credits |
| Apply another take | 5 credits |
| Unlock an MP4 export | 20 credits |
| Tour, prompt preview, flags/locks, choose an existing take, reload an unlocked export | Free |

Export charges apply once per project's selected-take snapshot. Changing to a different set of takes creates a separate export; returning to an already unlocked snapshot is free. There is no extra wallet payment at export time.

## Run

Use Python 3.12 or newer. From this folder:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn main:configured_app --factory --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` to try the routes. The JSON API contract is at `/openapi.json`; a saved copy is included as `openapi.json`.

Environment variables, if needed:

| Variable | Default | Purpose |
| --- | --- | --- |
| `TOON_DATABASE` | `data/toon.sqlite3` | Persistent database file |
| `TOON_CATALOG` | `catalog.json` | Prepared content catalogue |
| `TOON_ASSETS` | `assets/` | Directory containing the referenced media files |
| `TOON_FRONTEND_ORIGINS` | `http://localhost:5050` | Comma-separated exact browser origins |
| `TOON_SOLANA_RECIPIENT` | `FHBBpDTfzg6rKX3vHCGwNAgveGeExKKGwBvCwCeZFXb6` | Wallet receiving test USDC |
| `TOON_SOLANA_RPC` | `https://api.devnet.solana.com` | HTTPS Solana Devnet RPC; the server checks the network before accepting payment |

The frontend is confirmed as Next.js on port 5050, which is allowed by default. To set the address explicitly before starting the API:

```powershell
$env:TOON_FRONTEND_ORIGINS = 'http://localhost:5050'
.\.venv\Scripts\python.exe -m uvicorn main:configured_app --factory --host 127.0.0.1 --port 8000
```

Restart the API after changing this setting. On the hosting service, set the same environment variable to the actual frontend origin, including `https://` and any port, without a path or trailing slash. If local development uses `http://127.0.0.1:5050`, add that exact origin to the comma-separated list as well.

## Frontend calls

1. `POST /v1/sessions` returns a guest bearer token valid for seven days. Retain this token across page refreshes and reopening the demo; treat it as a credential. New sessions start with zero credits.
2. `GET /v1/catalog` supplies the scenarios, choices, supported selections, saved prompts, and shot revision options. Only offer combinations listed in `selections[].values`.
3. `POST /v1/prompt-previews` with `scenarioId` and `selectionId` returns a prepared prompt and its change reasons.
4. `POST /v1/projects` with those IDs creates the storyboard for 10 credits. Scenarios marked `isTour: true` are free previews. Send `Authorization: Bearer <token>` and `Idempotency-Key: <unique operation ID>`.
5. `GET /v1/projects` lists your projects; `GET /v1/projects/{project_id}` loads one with current media URLs.
6. `PATCH /v1/projects/{project_id}/shots/{shot_id}` changes `flagged`, `locked`, or `selectedTakeId`.
7. `POST /v1/projects/{project_id}/shots/{shot_id}/revisions` with `revisionOptionId` adds and selects a prepared alternate take for 5 credits, retaining the old one. Tour revisions are free.
8. `POST /v1/projects/{project_id}/exports` with `{}` unlocks an MP4 export snapshot for 20 credits only when a prepared finished video matches the selected take combination. Tour exports are disabled. Repeated requests for an already unlocked snapshot do not charge again.
9. `GET /v1/exports/{export_id}` returns the snapshot and a fresh download URL.

All project and export routes require the bearer token. Every POST/PATCH that changes a project or export also requires an idempotency key. Reuse the same key for a retry of the same operation; use a new key for a new operation. A repeated key returns the original operation's snapshot; reload the project to see subsequent edits.

Media URLs expire after 15 minutes. Reload the project or export to renew them. Browsers can play those URLs directly and make range requests. For MP4 download, the frontend can fetch the URL and save the resulting blob. The backend does not fetch arbitrary external URLs.

Validation errors return 422. Invalid/expired session tokens return 401. Other users' project IDs return 404. Locked-shot edits, reused keys with different inputs, and unsupported export combinations return 409. Insufficient credits return 402 with `detail: {"code":"insufficient_credits","balance":0,"required":10}`; no project, take, export, or debit is saved on failure. Normal errors use FastAPI's `detail` field; field-validation errors use its standard array format.

`contentMode: demo` and `aiGenerationEnabled: false` describe the submitted implementation. Show the prepared-content scope clearly in the guided demo and submission. There is no simulated generation progress.

## Wallet and credit purchase calls

Every route below requires the same session bearer token. Payment-intent creation and verification also require an `Idempotency-Key`.

1. Connect a Solana wallet on **Devnet** in the frontend. The paying wallet needs test USDC and some test SOL for fees and, on the first purchase, token-account creation.
2. `POST /v1/wallet-challenges` with `{"walletAddress":"<public address>"}` returns `id`, `message`, and `expiresAt`. Ask the wallet to sign the exact UTF-8 message. This connects the wallet and does not send tokens.
3. `POST /v1/wallet-links` with `{"challengeId":"<id>","signatureBase64":"<64 signature bytes encoded as base64>"}` verifies ownership. Challenges expire after five minutes and can be used once. If a response is lost, request a fresh challenge for the same wallet. A session can link one wallet.
4. `POST /v1/payment-intents` with `{"packId":"credits-100"}` returns `id`, `state`, `network`, `payer`, `recipient`, `mint`, `amount`, `amountAtomic`, `credits`, `reference`, `paymentUrl`, and `expiresAt`. This fixes 10 test USDC for 100 credits. The order's payment window is 15 minutes.
5. Build a direct SPL `TransferChecked` transaction for that order, include its reference as an extra read-only, non-signing account on the transfer instruction, and let the linked wallet sign and send it. Use the same wallet as the fee payer. See `../Frontend-payment-guide.md` for a browser-side example, including creation of the receiving token account if missing.
6. Save the returned transaction signature and payment ID. `POST /v1/payment-intents/{payment_id}/verify` with `{"transactionSignature":"<base58 signature>"}` asks the backend to check the finalized transfer. It returns `state: "pending"` until the finalized transaction is visible, then `state: "paid"` and `creditsGranted: 100`. Retry verification of the same transaction; do not send another payment while waiting.
7. `GET /v1/payment-intents/{payment_id}` resumes a purchase. `GET /v1/balance` returns `balance`, the fixed `prices`, `network`, and the last 50 credit ledger entries. Refresh the balance after every charged action.

The backend checks the Devnet genesis hash, transaction signatures, payer, token program, mint, amount, decimals, recipient, purchase reference, actual token balance changes, and payment timestamp. Credits and the unique transaction claim are committed together. Repeated or concurrent verification cannot grant extra credits. Wrong transfers return 422; a transaction already claimed for another purchase returns 409. RPC problems return 503 without granting credits.

The Solana Pay URL is useful for compatible wallets, but carries no network selector. The frontend must explicitly use Devnet. The verifier accepts direct `TransferChecked` instructions, including legacy and v0 transactions; sponsored fees, program-mediated payments, other tokens, Base, and Ethereum are outside this version.

This is a test-token demo with guest sessions, not a real-money account system. Wallet-based account recovery is not implemented. Losing or expiring the seven-day session token loses access to that session's credits/projects, and its linked wallet cannot be attached to another session. Keep the token for the demo; add account recovery before a public launch.

Official references: [Solana Pay transfer requests](https://docs.solanapay.com/core/transfer-request/merchant-integration), [Circle's Devnet USDC mint](https://developers.circle.com/stablecoins/usdc-contract-addresses).

## Add real assets

See `../Asset-checklist.md` and `catalog.example.json`. Copy the example into `catalog.json` only after replacing every placeholder and supplying the real files and SHA-256 checksums. The example is intentionally not loadable as production content.

The application checks asset paths, checksums, IDs, option combinations, and export references at startup. These checks do not inspect video codecs, sound, duration, resolution, or visual quality; those need media inspection before publishing.

Keep assets immutable and retain all assets referenced by existing projects and exports when updating the catalogue. The stored project snapshot keeps its original prompt, revision options, and export mappings. Removing an old referenced asset would break that project's media links.

## Verify

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s . -v
```

All 23 tests pass: 19 API/payment checks plus four black-box end-to-end flows. They cover ownership, choices, locks, take history, persistence, matching exports, signed download expiry/refresh, catalogue validation, wallet proofs, charges, rollback, concurrent spending/grants, tours, and legacy/v0 transfer validation including address lookup tables. The black-box flows run a real API process over HTTP, its normal payment verifier against a local HTTPS RPC fixture, and valid generated MP4s that are downloaded and decoded. No real tokens are sent and no synthetic media is added to the real catalogue. See `../Backend-test-report.md` for results and `../Backend-review-report.md` for the independent review.

To run just the black-box tests: `python test_e2e.py -v`. The extra media/HTTPS packages are in `requirements-dev.txt`, not the production dependency list.

## Hosting

See `../Deployment-guide.md` for the exact Render setup and hosted checks. `render.yaml` is ready for a repository with the backend files at its root; `.python-version` selects Python 3.12. The configuration uses a paid single-instance service with a persistent disk, but has not been published or purchased.

One service instance is sufficient for the hackathon demo. The SQLite database must live on persistent storage. If using Render, a persistent disk requires a paid service; do not put this database on an ephemeral filesystem. No hosting account or paid subscription has been created.

Example start command: `uvicorn main:configured_app --factory --host 0.0.0.0 --port $PORT`. Set the actual frontend origins, use HTTPS, put `TOON_DATABASE` and any uploaded media on the persistent volume, and back up the database. Keep the server clock correct because media links and sessions expire by time. Move to managed Postgres before running multiple service instances.

[FastAPI API documentation](https://fastapi.tiangolo.com/tutorial/first-steps/) · [Render FastAPI deployment](https://render.com/docs/deploy-fastapi) · [Render persistent storage](https://render.com/docs/disks)
