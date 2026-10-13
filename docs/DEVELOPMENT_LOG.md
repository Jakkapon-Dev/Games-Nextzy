# Development log

**English** · [ภาษาไทย](DEVELOPMENT_LOG.th.md) · [Back to README](../README.md)

The main problems I ran into while building this project, what caused them, and how I fixed them. Every change went through a pull request with CI. The history is visible in the repository.

## Timeline

| Day            | Work                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Day 1 (9 Oct)  | Repository, npm workspaces, NestJS and Next.js scaffolds, Prisma, CI. All API endpoints with unit and end-to-end tests. Web proxy, typed API client and session start-up. |
| Day 2 (10 Oct) | Home page from the Figma design, component tests, the time zone fix, the game page with its animation, the health check, deployment and documentation.                    |

## Problems and fixes

### 1. Timestamps shifted by seven hours ([#19](https://github.com/Jakkapon-Dev/Games-Nextzy/issues/19))

- **Problem:** On a PostgreSQL server whose time zone was Asia/Bangkok, rounds played through the API were stored seven hours early. Rows written by other clients came back seven hours late. The UI looked correct because the two shifts cancelled out, so the tests did not catch it.
- **Cause:** Prisma's `pg` driver adapter writes and reads timestamps as UTC, but the database session used the server's time zone.
- **Fix:** The connection now sets `-c TimeZone=UTC`. New end-to-end tests check both directions, comparing with timestamps written directly in SQL. CI runs PostgreSQL with `TZ=Asia/Bangkok` and checks the session time zone, so this class of bug fails the build.
- **Lesson:** A test that writes and reads through the same layer can hide a pair of matching bugs. Compare against an independent source.

### 2. Deploying on free plans

- **Render has no pre-deploy step on the free plan.** The blueprint runs `prisma migrate deploy` before `node dist/main` in the start command. `start:prod` stays migration-free, so running it locally never changes a database.
- **Build tools are devDependencies.** With `NODE_ENV=production`, `npm ci` skips them, so the build runs `npm ci --include=dev --workspace=api`. The workspace flag also skips the web app's dependencies.
- **The Prisma Client is not committed.** The API `build` script runs `prisma generate` first.
- **Supabase connection:** the session pooler on port 5432 works for both the running API and migrations. A direct connection needs IPv6, and the transaction pooler on 6543 is meant for serverless.
- **Supabase Data API disabled:** the tables live in the `public` schema, so leaving the Data API on would expose them through Supabase's REST API.
- **Cookies through a proxy:** Vercel rewrites `/api/*` to Render, so the cookie belongs to the Vercel domain and stays first-party. I checked on production that it has `HttpOnly; Secure; SameSite=Lax`.

### 3. Implementation did not yet match the planned architecture

- **Problem:** The architecture review found that game rules were pure functions, but the feature services still imported Prisma and HTTP DTOs. The implementation therefore did not satisfy the planned dependency separation.
- **Fix:** Extract plain TypeScript use cases and application-owned ports. Move controllers/DTOs into presentation, persistence and crypto implementations into infrastructure, and compose them in NestJS modules. Session resolution now returns an application-owned player snapshot instead of a Prisma type.
- **Risk and trade-off:** Splitting writes into independent repositories could break atomicity. A shared progress unit-of-work port keeps play, claim, and reset inside one locked-player transaction. It contains the small set of operations these three workflows actually need, rather than a generic repository framework.
- **Verification:** Preserve the existing HTTP E2E cases for concurrency, caps, idempotency, reward errors, and reset. Add database-independent use-case tests, dependency-boundary tests, and PostgreSQL tests that force failed writes to prove rollback of rounds and cleared histories. Also test a reset racing with play and claim, and the health-probe failure response. No schema migration or frontend change is needed.

## Decisions worth noting

- **The server decides the score.** A highlight runs across the options while the round is requested, but it stops where the API response says, so the browser cannot choose the outcome.
- **The order of claim errors is fixed:** 404 for an unknown checkpoint, then the version check, then `CHECKPOINT_LOCKED`, then `REWARD_ALREADY_CLAIMED`. Clients get the same answer for the same state.
- **Reset keeps the session** and increments `progressVersion`, so other open tabs notice and reload instead of writing to old progress.
- **Near the cap the dialog shows both numbers,** the score drawn and the points credited, so 3,000 never silently becomes 200.
- **Animation timing:** the highlight steps every 0.07 s while the API draws (at least 0.9 s), then slows down over eight steps (0.1 s to 0.95 s), rests 0.35 s on the picked option and waits 0.4 s before the result. None with `prefers-reduced-motion`.
