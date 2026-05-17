# Code Review — task-api

Reviewed: `task-api-backend` (Node 18+/Express 5/Prisma/Postgres) and `task-api-frontend` (React 19/Vite/Axios).

Overall, the project is small, well-organized, and follows a clean layered structure (routes → controllers → services → repositories). The biggest concerns are a couple of real correctness/security bugs (`.escape()` corrupting data on input, a probable plaintext DB password in `.env`, a TOCTOU race in update/delete) and a tracked frontend `.env`. Frontend code is readable but has some optimistic-update inconsistencies and over-eager refetching.

Findings are grouped by severity. Line numbers refer to the file as it exists on disk.

---

## High-severity findings

### 1. `body.escape()` corrupts stored data — wrong layer for sanitization

`src/middleware/validateTask.js:6-7` and `src/middleware/validateTaskUpdate.js:6-7` both call `.escape()` on the `title` field before it reaches Prisma. `express-validator`'s `.escape()` HTML-encodes the input, so a user who creates a task titled `Buy <eggs> & milk` will see `Buy &lt;eggs&gt; &amp; milk` stored in Postgres, and the same string returned by the API the next time. This is a real data-corruption bug, not a theoretical one.

`.escape()` is for input that is about to be inlined into HTML on the server. This API stores structured data and returns JSON, and the consumer (React) sets text via `{task.title}`, which React already escapes. The right fix is to remove `.escape()` from both validators and rely on React's built-in escaping on the rendering side. If you ever start rendering task titles into HTML on the server (or into emails, PDFs, etc.), escape there, not here.

### 2. Likely-real DB password in `.env`

`task-api-backend/.env` contains:

```
DATABASE_URL=postgres://postgres:Senay163264@localhost:5432/tasks_db
```

The good news: `.env` is in `task-api-backend/.gitignore` and `git ls-files` confirms it is not tracked. The bad news: that password looks like a real password tied to your name, sitting in cleartext on disk and in any backup/sync of the Desktop folder. Rotate the local Postgres password to something random, keep `.env` out of git (already done), and consider using a `.env.example` (with placeholder values) committed to the repo so collaborators know which keys are needed.

### 3. `task-api-frontend/.env` is tracked in git

```
$ git ls-files --error-unmatch task-api-frontend/.env
task-api-frontend/.env
```

The file content (`VITE_API_URL=http://localhost:3000`) is not secret, but `.env` files should not be committed as a matter of habit — the moment you add a real key later you'll leak it. The frontend `.gitignore` already lists `.env` on line 28, so the file is tracked because it was committed before the ignore rule existed. Untrack it without deleting the working copy:

```
git rm --cached task-api-frontend/.env
git commit -m "Stop tracking .env"
```

Then add a committed `task-api-frontend/.env.example` documenting `VITE_API_URL`.

### 4. TOCTOU race in update/delete; Prisma errors leak through error handler

In `src/controllers/taskController.js`, both `updateTask` (lines 58–62) and `deleteTask` (lines 79–82) first call `getTaskById(id)` and 404 if missing, then call the mutating operation. Between those two awaits, another request can delete the row, so the second call throws Prisma's `P2025 RecordNotFound`. That error then falls through to the error middleware in `src/server.js:28-34`, which echoes `err.message` to the client — leaking Prisma internals like `"An operation failed because it depends on one or more records that were required but not found."`

Prefer doing the mutation directly and catching `P2025`:

```js
try {
  const updated = await taskService.updateTaskById(id, updates);
  res.status(200).json(updated);
} catch (err) {
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Task not found' });
  }
  next(err);
}
```

While you're there, change the global error handler to only forward `err.message` for `4xx` errors and return a generic `"Internal Server Error"` for `5xx`. Always log the full error server-side.

---

## Medium-severity findings

### 5. Schema: `completed Boolean?` should not be nullable

`prisma/schema.prisma:20` declares `completed Boolean? @default(false)`. The `?` makes the column nullable, which contradicts the default and means a `PATCH { "completed": null }` would persist `NULL`, producing a third state the UI doesn't handle (`task.completed` is rendered as an unchecked checkbox, but a future filter or sort could behave unexpectedly). Drop the `?`:

```prisma
completed Boolean @default(false)
```

You'll need a migration; existing rows already have `false` from the default.

### 6. `validateTask`/`validateTaskUpdate` don't coerce booleans

Both validators use `body('completed').optional().isBoolean()`. `isBoolean()` accepts the strings `"true"`, `"false"`, `"0"`, `"1"` as valid, but does not coerce them. If a client sends `{ "completed": "true" }`, the validator passes and Prisma receives the string, which will throw at the DB layer and again leak through the error handler. Either tighten to `isBoolean({ strict: true })` or add `.toBoolean()` after validation if you want to be lenient.

### 7. PATCH `title: null` is rejected, but only by accident

`validateTaskUpdate.js:5-10` chains `.optional()` (which skips when the value is `undefined`, not `null`) → `.trim()` → `.escape()` → `.isLength({ min: 3 })`. I tested this with `{ "title": null }`: `.trim()` coerces `null` to the empty string, then `isLength` fails with the length message, so the request is correctly rejected with 400. That's good — but the rejection depends on `.trim()` being present, and the error message ("Title must be at least 3 and at most 100 characters") is misleading for a `null` payload. Either tighten the validator to explicitly reject `null` (`.optional({ values: 'null' })`) so the message matches the cause, or accept this as defensible and document it.

### 8. OpenAPI doc advertises filters the implementation doesn't have

`docs/paths/tasks.yaml:6-20` documents `?completed=…` and `?limit=…` query parameters on `GET /tasks`, but `taskController.getTasks` ignores `req.query` and `repositories/taskRepo.js:findAll()` calls `prisma.task.findMany()` with no arguments. Either implement filtering and pagination (recommended — `findMany` will quickly become a problem) or remove the parameters from the spec until they're real. If you implement them, validate them through the same middleware pattern (`query('completed').optional().isBoolean().toBoolean()` etc.).

### 9. Open CORS

`src/server.js:10` uses `cors()` with no options, which sets `Access-Control-Allow-Origin: *`. Fine in local dev; bad in production. At minimum, scope it to the deployed frontend origin via an env-driven allowlist before deploying.

### 10. No graceful shutdown / Prisma disconnect

`src/server.js:36-38` calls `app.listen` but never handles `SIGINT`/`SIGTERM`. On shutdown, in-flight requests are dropped and the Prisma connection pool stays open until the process is killed. Add:

```js
const server = app.listen(PORT, …);
const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

---

## Low-severity findings

### 11. ESLint config disables `no-unused-vars`

`eslint.config.js:11` sets `'no-unused-vars': 'none'`. This hides real dead code; `next` in `getTasks` is unused, and a few imports might drift. Set to `'warn'` with `{ argsIgnorePattern: '^_' }` so you can opt out per-arg when needed.

### 12. `nodemon` in devDependencies is unused

The `dev` script in `package.json:7` uses Node's built-in `--watch`, so `nodemon` (devDep) is dead weight. Drop it.

### 13. Inconsistent quoting/style across files

Single vs. double quotes mix freely (`validateTask.js` uses single, `validateTaskUpdate.js` uses double, controller mixes both). You have Prettier installed — wire it into a pre-commit hook or `lint-staged` so the style stays consistent.

### 14. Frontend: full refetch after every mutation

`pages/Tasks.jsx:85` and `:137` call `await loadTasks()` after create and edit, which round-trips the entire list for every change. Delete already does the local-state update; do the same for create (append the returned task) and edit (replace by id). Less network, smoother UX.

### 15. Frontend: optimistic toggle never reconciles

`handleToggle` (`pages/Tasks.jsx:45-64`) flips `completed` locally before/after the request but never replaces the row with the server's response, so if the server returns a different shape (e.g., once you add `updatedAt`) the local copy will drift. Use the value returned by `updateTask`.

### 16. Frontend: no race protection on `loadTasks`

If two `loadTasks()` calls overlap (e.g., user toggles a filter mid-refresh, though currently filtering is client-side), the later result-setting could overwrite the earlier one in either order. Use an `AbortController` or a request-id token if you start firing parallel loads.

### 17. Frontend: filename/export naming mismatch

`src/pages/TaskFilter.jsx` exports `TaskFilters` (plural). Pick one — either rename the file or the export — to avoid confusion at import sites.

### 18. Frontend: `App.jsx` wraps a single child in a Fragment

`src/App.jsx:5-9` wraps `<Tasks />` in `<>…</>` for no reason. Return `<Tasks />` directly until there's a sibling.

### 19. READMEs are stubs

Both `README.md` files are one or two lines. At minimum, document: prerequisites, env vars (`DATABASE_URL`, `VITE_API_URL`), how to run migrations and seed, how to start dev servers, and the API surface (link to `/api-docs`).

### 20. No tests

There's nothing under `__tests__/`, `test/`, or `*.test.js`. Given the size, a handful of supertest-based integration tests on the controllers (especially around validation edges and the 404/400 paths) would pay for themselves quickly.

---

## Suggested fix order

Do these first, in order: untrack the frontend `.env` and rotate the Postgres password (#2, #3), remove `.escape()` from the validators (#1), and replace the get-then-mutate pattern with `P2025` catches plus a non-leaky error handler (#4). After that, fix the schema nullability and validator coercion (#5–#7), then start chipping at the documentation/test/style debt.
