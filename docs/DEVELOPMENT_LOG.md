# Development log

**English** · [ภาษาไทย](DEVELOPMENT_LOG.th.md) · [Back to README](../README.md)

Real problems I ran into while building this project, what caused them, and how I fixed them. Every change went through a pull request with CI. The history is visible in the repository.

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

### 2. Scaffolding tools added files I did not ask for

- **Problem:** After the scaffolding commands, `git status` showed extra files. `prisma init` created AI agent folders and a skills lock file, and `next dev` generated an `AGENTS.md`.
- **Fix:** Deleted the generated files and set `agentRules: false` in `next.config.ts`. I check `git status` after every generator and avoid running `prisma init` again.
- **Lesson:** Read what a generator wrote before committing it.

### 3. Deprecation warning when the tests ran migrations

- **Problem:** Node printed `DEP0190` during the end-to-end test setup.
- **Cause:** The setup called `execFileSync` with `shell: true` and an argument list, which Node now deprecates.
- **Fix:** Run the single command string with `execSync`.

### 4. `MaxListenersExceededWarning` in end-to-end tests

- **Problem:** Tests that fire many requests at once with Supertest printed a listener warning.
- **Cause:** Supertest starts a temporary server for each request when it is given an app that is not listening.
- **Fix:** The test app listens on port 0 once, and all requests share that server.

### 5. Native `<dialog>` in tests

- **Problem:** Component tests failed because jsdom does not implement `HTMLDialogElement.showModal()`.
- **Fix:** A small shim in `vitest.setup.ts` sets the `open` attribute. Only the files that need the DOM use jsdom (`// @vitest-environment jsdom`), so the other tests stay fast.

### 6. Two buttons named "ปิด"

- **Problem:** The claim dialog had a close icon and a "ปิด" (close) button with the same accessible name, so a screen reader could not tell them apart and `getByRole` found two matches.
- **Fix:** The icon is labelled "ปิดหน้าต่าง" (close window).

### 7. The retry button did not retry the step that failed

- **Problem:** When creating the session failed, the error state showed a retry button, but it only refetched the progress query, which was still waiting for the session.
- **Fix:** `useProgress().retry` retries the session if that was the failed step, otherwise the progress. The history section now hides itself when there is no session, instead of showing a skeleton forever.
- **Note:** While testing this I saw that retries paused in a background tab. That is expected: TanStack Query pauses retries while the window is not focused.

### 8. Retry typing in TanStack Query

- **Problem:** Passing a shared `shouldRetry` function straight to `retry` made the error type `unknown` in the query hooks.
- **Fix:** A typed wrapper, `(failureCount, error: Error) => shouldRetry(failureCount, error)`. Only network errors and 5xx responses are retried, never 4xx.

### 9. History notes wrapping in the middle of a phrase at 300px

- **Problem:** At the narrowest width, the short note next to a history title (for example the credited points near the cap) broke inside a phrase.
- **Fix:** The note is an `inline-block` with `whitespace-nowrap`, so it moves to the next line as a whole.

### 10. Matching the design without copying pixels

- **Problem:** The Figma file uses absolute positions, and the coin icon I first drew had its colours inverted.
- **Fix:** I used Figma for intent (layout, spacing, colours, typography) and built the layout with flex and grid so it adapts from 300px to tablet. I redrew the coin SVG from the design's values. Design tokens live in the `@theme` block of `globals.css`.

### 11. Styles missing after switching branches

- **Problem:** After switching between branches with different CSS, the dev server sometimes served the page without styles.
- **Fix:** Stop the dev servers and delete `apps/web/.next`. This was only a local cache issue.

### 12. Deploying on free plans

- **Render has no pre-deploy step on the free plan.** The blueprint runs `prisma migrate deploy` before `node dist/main` in the start command. `start:prod` stays migration-free, so running it locally never changes a database.
- **Build tools are devDependencies.** With `NODE_ENV=production`, `npm ci` skips them, so the build runs `npm ci --include=dev --workspace=api`. The workspace flag also skips the web app's dependencies.
- **The Prisma Client is not committed.** The API `build` script runs `prisma generate` first.
- **Supabase connection:** the session pooler on port 5432 works for both the running API and migrations. A direct connection needs IPv6, and the transaction pooler on 6543 is meant for serverless.
- **Supabase Data API disabled:** the tables live in the `public` schema, so leaving the Data API on would expose them through Supabase's REST API.
- **Cookies through a proxy:** Vercel rewrites `/api/*` to Render, so the cookie belongs to the Vercel domain and stays first-party. I checked on production that it has `HttpOnly; Secure; SameSite=Lax`.

### 13. Implementation did not yet match the planned architecture

- **Problem:** The architecture review found that game rules were pure functions, but the feature services still imported Prisma and HTTP DTOs. The implementation therefore did not satisfy the planned dependency separation.
- **Fix:** Extract plain TypeScript use cases and application-owned ports. Move controllers/DTOs into presentation, persistence and crypto implementations into infrastructure, and compose them in NestJS modules. Session resolution now returns an application-owned player snapshot instead of a Prisma type.
- **Risk and trade-off:** Splitting writes into independent repositories could break atomicity. A shared progress unit-of-work port keeps play, claim, and reset inside one locked-player transaction. It contains the small set of operations these three workflows actually need, rather than a generic repository framework.
- **Verification:** Preserve the existing HTTP E2E cases for concurrency, caps, idempotency, reward errors, and reset. Add database-independent use-case tests, dependency-boundary tests, and PostgreSQL tests that force failed writes to prove rollback of rounds and cleared histories. Also test a reset racing with play and claim, and the health-probe failure response. No schema migration or frontend change is needed.

## Decisions worth noting

- **The server decides the score.** The web app requests a round first and then animates towards the result, so the browser cannot choose the outcome.
- **The order of claim errors is fixed:** 404 for an unknown checkpoint, then the version check, then `CHECKPOINT_LOCKED`, then `REWARD_ALREADY_CLAIMED`. Clients get the same answer for the same state.
- **Reset keeps the session** and increments `progressVersion`, so other open tabs notice and reload instead of writing to old progress.
- **Near the cap the dialog shows both numbers,** the score drawn and the points credited, so 3,000 never silently becomes 200.
- **Animation timing:** 0.6 s per eliminated option and 0.4 s before the result, and none with `prefers-reduced-motion`.
