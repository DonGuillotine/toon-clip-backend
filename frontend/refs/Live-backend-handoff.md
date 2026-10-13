# Toon Clip live backend

The API is deployed and running on Render.

- API base URL: **https://toon-clip-api.onrender.com**
- Interactive endpoint docs: https://toon-clip-api.onrender.com/docs
- API contract: https://toon-clip-api.onrender.com/openapi.json
- Health: https://toon-clip-api.onrender.com/health
- Catalogue: https://toon-clip-api.onrender.com/v1/catalog
- Private source: https://github.com/DonGuillotine/toon-clip-backend
- Render dashboard: https://dashboard.render.com/web/srv-db5etvvlot8c73enknu0

## For the Next.js developer

Set this in the frontend's environment configuration, then restart or rebuild Next.js:

```dotenv
NEXT_PUBLIC_API_URL=https://toon-clip-api.onrender.com
```

This is a public URL, not a secret. Do not add `/docs` or `/v1` to the base URL if the frontend already supplies route paths.

Browser API access currently allows `http://localhost:5050`. Use that exact address during local development. If using `http://127.0.0.1:5050` or a deployed frontend, share that exact origin so it can be added to `TOON_FRONTEND_ORIGINS` on Render. Put the public frontend origin first when configuring it; the wallet sign-in message uses the first configured origin's domain.

For API calls, first create a session with `POST /v1/sessions`, retain the returned token, and send `Authorization: Bearer <token>` on authenticated calls. Send a fresh `Idempotency-Key` for each new billable action; reuse it when retrying the same action. Session tokens expire after seven days. There is no wallet-based account recovery yet.

Use the wallet signing and transaction example in `Frontend-payment-guide.md`. Payments stay on **Solana Devnet**. Buy **100 credits for 10 test USDC**; create costs 10 credits, revise costs 5, and unlock MP4 export costs 20. Export does not need another wallet checkout.

## What is verified

The deployed API passed 18 initial HTTP checks and 15 after a confirmed restart. Sessions, wallet links, purchase records, and duplicate-request handling survived. The live server can reach Solana Devnet; a nonexistent transaction stayed unpaid and granted no credits. No tokens were transferred during these checks.

## What the team still needs to supply

The real catalogue is empty, so health reports `demoReady: false`. Supply one complete prepared example first: character image, saved original/improved prompts and reasons, shot MP4s, alternate takes, and finished MP4s matching the supported take combinations. Upload media to the disk before publishing its catalogue entries. See `Asset-checklist.md` and `Deployment-guide.md`.

Next, share the public frontend URL and complete a real Devnet wallet checkout, creation, revision, export unlock, and download through that frontend. Those full hosted flows have not been verified yet.

## Hosting cost and limits

The backend uses the $7/month server and a 1 GB disk at $0.25/month, on the $0/month Hobby workspace. The base rate is **$7.25/month**, before taxes or extra usage. The database lives at `/var/data/toon.sqlite3`; media belongs in `/var/data/assets`. Keep one backend instance. Restarts and deployments briefly interrupt service. Keep existing published media when adding new examples.
