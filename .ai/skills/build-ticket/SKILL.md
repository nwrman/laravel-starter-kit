---
name: build-ticket
description: Run one build ticket through the full implementation loop. Started from the main checkout, it hands the ticket to a Claude session in its own worktree (or builds in place on request); that session runs a plain-language brief confirmed before any code, then builds the shape and settles it before pinning anything — impeccable design pass, a browser walk of every state, the human's acceptance on gate tickets, adversarial code review, spec-conformance verification — and only then writes the tests, runs the blocking `composer preflight` gate, lands the ticket (a PR for a human to merge, or commits on the spec's integration branch), and closes with an account of what now exists. Use when asked to work, implement, or build a ticket by number (e.g. "/build-ticket 33"), or bare ("/build-ticket") to take the next ready ticket off the frontier.
---

# Build a ticket

Runs ONE GitHub ticket of a staged build through the agreed loop. The routing lives
here, in writing — agents fill the jobs, never the plan.

Assumes the ticket graph described in `reference/spec-and-tickets.md`: one spec issue,
one issue per ticket (a GitHub sub-issue of the spec), native "blocked by" dependencies,
and markers in the acceptance criteria. Issue-tracker commands: `docs/agents/issue-tracker.md`.

The loop is bracketed on purpose: it opens with a brief saying what will exist when the
ticket is done, and closes with an account of what does. Everything between them is
evidence that the second matches the first.

**And it is ordered on purpose.** Everything that can still change the shape happens before
anything that pins it:

```
brief → build → look at it → impeccable → walk it → the human accepts → code review
      → verify → TESTS → test review → preflight → land → merge
```

Tests, the gate and the PR are downstream of every reviewer for one reason: a finding that
lands after them costs a code change *and* a test rewrite *and* a re-run. On the descendant
build this loop comes from, three whole test suites were written test-first and deleted with
the structures they described. Not one of them churned because a behaviour was wrong.

**Hard rules (task-graph guardrails):**

- Never merge a PR. Never push to `main`. A human merges every PR by hand.
- One writer per file: only the implementer edits code. Verifier and reviewers are read-only;
  their findings route back to the implementer — and they stay isolated **from each other**.
  Never hand one reviewer another's report. When the design review and the spec verifier
  independently name the same top defect, that agreement is the signal, and it only means
  something because neither had seen the other.
- Every verify/fix cycle caps at **3 rounds**; if still failing, stop and report.
- **Nothing is built before the brief in step 1 is confirmed.** It is a gate, like preflight.
- **Nothing is pinned until the shape is settled.** The order is: build → look at it →
  `impeccable` → the human accepts → code review → verify → **then** tests → then the gate.
- **A user-facing surface gets the `impeccable` pass before anyone else looks** (step 4).
  Handing the human a rendered wireframe makes them the design reviewer.
- **On a `🛑 GATE` ticket, the human accepts BEFORE the reviewers, the tests and the gate**
  (step 6). They decide what the screen should be; every step past them costs a full cycle
  to redo.
- **`composer preflight` must be green before the ticket lands.** It is a gate, not a final
  tidy-up: see step 11, and never report a ticket as done without pasting its summary table.
- **A green suite is not evidence the app works.** Step 5's walk is not optional and not a
  formality.

## Which session is this? — settle it first

A ticket normally runs across **two sessions**, in two different directories, and this skill
does a different job in each. `pwd` decides which:

| Where you are | What you do |
| --- | --- |
| The main checkout (first line of `git worktree list`) | **Phase A** — hand the ticket to its own session, then stop |
| A ticket worktree | **Phase B** — the whole build loop, steps 0–13 |
| The main checkout, and the human asked for **no worktree** | **In place** — Phase A's checks, then Phase B right here |

The split is not tidiness. **MCP servers start once, with the session's launch directory,
and never move.** `.mcp.json` runs `php artisan boost:mcp` by relative path, so a Boost booted
in main keeps answering about main forever — measured: a session that switched into a
worktree still got main's `APP_URL` from `get-absolute-url`, while a fresh `claude` launched
inside the worktree got the worktree's. Run a worktree build from main and every Boost answer —
`database-query`, `browser-logs`, `get-absolute-url`, `record-rule` — is quietly about the
wrong checkout. Building in place has no such gap: the session is already rooted where the
work happens.

## Phase A · In main: hand the ticket to its own session

Main's whole job is to choose the ticket and name its branch. It claims nothing, provisions
nothing, and never runs a command aimed at another directory.

1. **No ticket number given?** Compute the frontier: open `ready-for-agent` issues **without
   the `in-progress` label** whose blockers are all closed. Exactly one → take it and say so.
   Several → list them one line each and ask which (one question, options, no essay).
   None → report what's blocking and stop.
2. `gh issue view <N>` — enough to read the title and confirm every blocker is CLOSED.
   Blockers are GitHub's native issue dependencies — `to-tickets` writes them that way:
   `gh api repos/{owner}/{repo}/issues/<N> --jq .issue_dependencies_summary.blocked_by`
   counts the open ones, and must be 0. A ticket written by hand may carry a `Blocked by #M`
   line in its body instead; check each issue it names. If the ticket already carries
   `in-progress`, **stop — another agent owns it** (unless the human explicitly says to take
   it over).
3. **Read the delivery mode** from the ticket body — never ask:
   - **Integration** — the Parent section names a branch ("ships on `feature/x`, the single
     PR for #M"). The ticket branches from that branch and lands back on it; the spec ships
     as one PR later.
   - **PR** (default) — no integration branch named. The ticket branches from `main` and
     gets its own PR.
4. **Name the branch**: `<type>/t<N>-<short-kebab-name>` (e.g. `feature/t33-user-import`).
   The type prefix is the repo's standing convention (`create-feature-branch`): `feature/`
   for new functionality, `fix/`, `docs/`, `refactor/`, `chore/` — pick it from *what the
   ticket builds*, which is judgment and is why this step is not in the script.
5. Hand it over:

   ```bash
   scripts/start-ticket.sh <N> <type>/t<N>-<name> [seed|clone] [base]
   ```

   Mode defaults to `seed`; pass `clone` when the ticket carries `🗄️ CLONE`. Base defaults to
   `main`; pass the integration branch in integration mode. In a Supacode session the script
   opens a tab in the new worktree that provisions it and starts Claude on this same skill —
   arriving in Phase B. Without Supacode it creates the worktree with plain git and prints
   the one command to run in a new terminal; relay it. If a worktree for the ticket already
   exists it reattaches instead of making a second one.
6. **Say one line and stop.** Which ticket, which branch, where work continues. Do not
   narrate the loop you are not running.

**In place instead?** When the human says "no worktree" or "in this session", do steps 1–4,
then create the branch here (`git switch -c <branch> <base>`, then
`git config branch.<branch>.tiaBase <base>` so the TIA commands know its base; in integration
mode with the integration branch already checked out, work directly on it) and continue with
Phase B in this session. No provisioning, no new tab. The site is the main checkout's own
`http://<project>.test`, and in place is one ticket at a time — parallel tickets need
worktrees.

## Phase B · The loop

Everything below runs where the ticket is built — its own worktree, or the main checkout
when building in place — so `pwd`, the Herd site, the databases and every MCP server
already point at the right place. In a worktree the site is `http://t<N>.<project>.test`
(`scripts/worktree-names.sh` derives it; `worktree-setup.sh` printed it).

## 0 · Claim the ticket

0. The ticket number arrived with the invocation, and Phase A already checked the blockers
   and the delivery mode. Re-read the ticket in full here — Phase A read only the title.
1. **Claim it** before touching anything:
   `gh issue edit <N> --add-label in-progress` and comment
   `Claimed — branch <branch>, <date>`. The label is the lock; the comment says who to
   ask. Release it (`--remove-label in-progress`) whenever this run ends without the ticket
   landing — blocked, failed, or abandoned — so it returns to the frontier.
2. Read the parent spec issue and every spec or design document the acceptance criteria
   name. Read the standing rules: every file whose globs match the paths in scope per
   `.ai/rules/index.md`, plus `CLAUDE.md` and `.ai/guidelines/`. Read `GLOSSARY.md` for the
   domain language and the ADRs in `docs/adr/` that touch the area.
3. **Grep the corpus for the *mechanism*, not just the documents the ticket names.** Before
   building anything that leaves the app — a mailed link, an upload, a signed URL, a
   webhook, a queued job — search `docs/` and `.ai/rules/` for that mechanism. Hazards get
   written down against the slice that hit them first, and the next slice inherits the
   hazard without the document. Measured on a descendant: a recovery mail rotated a password
   when a mail scanner prefetched the link — a hazard the repo had already solved *in
   writing*, in a document that belonged to a different slice and so was never opened.
4. Note the body markers: `🛑 GATE` (the human's acceptance at step 6) and `🗄️ CLONE`
   (provisioned against real data — Phase A already passed it to the setup script).

## 1 · The brief — say what you are going to build

**Before any code, write down what will exist when this ticket is done, and get a `go`.**
One message, no essay. Not a restatement of the acceptance criteria — a description of the
software:

- **What a person can do that they could not before**, screen by screen, in the words a
  user would use. "A user who forgot their password can ask for a new one from the login
  screen and receives a mail with a link" — not "implements requirement 3.8".
- **What changes underneath**: tables, columns, routes, packages, anything deleted.
- **What this ticket deliberately does not build**, and the ticket number that owns each
  piece. Name them now; step 8 checks every one of those tickets exists and says so.
- **Anything in the acceptance criteria you are going to build differently**, and why.

Then stop and wait.

**If building a criterion as written would ship a security or correctness defect, say so
here and stop.** The acceptance criteria are a plan, not a contract. On the descendant this
loop comes from, a criterion said a recovery mail rotates the password and sends it — and the
username was guessable, so anyone could lock a user out of their account. Writing the brief
exposed it. Fixing it there cost one conversation; after the merge it would have cost a
migration and an incident.

When the brief changes the spec, **the spec changes first and lands as its own commit** —
the spec documents, the ticket's acceptance criteria via `gh issue edit`, and any wireframes.
Code that disagrees with a written spec is a defect no matter which one is right. Keep the
brief; step 13 reports against it.

## 2 · Confirm the ground

In a worktree, the tree was created and provisioned before this session started. Spend
thirty seconds proving that actually happened, rather than discovering it at step 11:

```bash
pwd && git branch --show-current          # the worktree, on the ticket's branch
grep -E '^(APP_URL|DB_DATABASE)=' .env    # t<N>.<project>.test, and its own database
curl -sI "http://t<N>.<project>.test" | head -1   # the site answers
```

If any of the three is wrong, re-run `scripts/worktree-setup.sh [seed|clone]` here rather
than working around it — a mismatched `.env` means the browser walk and the suite are
looking at different databases. A new worktree is not a clean checkout: Supacode copies
untracked and ignored files across from main, `.env` included.

In place, confirm only the branch: `git branch --show-current`.

Then the TIA baseline, in both cases:

```bash
php artisan toolkit:tia inherit
```

It copies the baseline the last landed ticket published for this branch's base, or says the
branch already has one. When neither exists it says so, and the first `composer test` does the
full run. Either outcome is fine; what it prevents is a ticket diffing against a stale or empty
baseline without anyone noticing.

Record the ticket's rules while you are at it: `record-rule` writes to the checkout this
session launched in, so a rule recorded during the ticket lands on the branch and ships
with it.

## 3 · Build it — shape first, nothing pinned

**Do not test-drive the shape.** Tests answer "does this behave right"; they say nothing
about where the code belongs, and writing them first makes moving it cost three times as
much. On the descendant build, one slice was written test-first three times over — as an
Action, as a shared Inertia prop, as a controller — and each set of tests was deleted with
the structure it described.

So the order is:

1. **Build the thing and look at it**, in the browser, on the dev server. The human may be
   watching the same screen; a shape they can see is a shape they can correct in one
   sentence, which is several rounds cheaper than one they have to read a diff to find.
2. **Settle the shape** — the design pass at step 4, the walk at step 5, the human at step 6,
   the reviewers at steps 7 and 8.
3. **Then write the tests** (step 10), against the shape that survived. Everything the test
   rules ask for still applies in full; it applies *later*.

**TDD is still right where the shape is already settled and the behaviour is fiddly.** The
one piece of that slice written test-first that did NOT churn was a phone-link formatter —
dial pauses, number-length bounds, dropping a number rather than linking it — because the
spec had pinned every case before a line was written, and the only question was whether the
code obeyed. That is the test: **is the open question "what should this do" or "where should
this live"?** Test-drive the first — call the Skill tool with `tdd` for it. Never the second.

What governs the CODE as you write it:

- Every rule the project records — naming, source language, theme, ID strategy — per the
  rule files read in step 0.
- **Prose is a claim, and the next reader will trust it.** Most of one descendant ticket's
  defects traced to a comment, docblock, ADR clause or rule file asserting a behaviour nobody
  had checked — each plausible, each repeated across several files until it read as
  corroborated, each with a passing test beside it. Write a sentence about how something
  behaves only if you watched it behave that way. **Before writing "the framework does X"**,
  open the framework and read it. Same for "the framework won't let us do X": prove it with a
  test or disprove it by trying. And if a constant exists so that copy stays consistent, a
  test must prove the constant *is* the copy.
- **Commit as you go, one unit of work per commit.** Conventional Commits
  (`type(scope): subject`), referencing `#<N>`, and a ticket lands as *several* commits —
  never one blob at the end. The spec amendment from step 1, a dependency change, the
  migration, the model, the surface and any tooling fix are separate units even though they
  ship together. Findings from steps 5–9 get **one commit each**, so the human can see which
  finding produced which change. If the history drifted anyway, reshape it before landing —
  never after review has started.
- Finish with `vendor/bin/pint --dirty --format agent`, then go to step 4.

**Touching the front end? Start `bun run dev` in the background, first thing, and say so.**
Not at the end to check your work — at the start, so the human can watch the screen change
while you build it. Vite's HMR pushes each save straight to the ticket's site. Leave it
running for the whole ticket; step 5's walk uses the same server. In place, a dev server may
already be running for main — use it rather than starting a second one.

Two things follow from it. **A dev server is not a build**: `bun run build` writes the
manifest the browser suite and `composer preflight` read, and HMR does not, so a green screen
is no evidence for either gate. And when the run ends, **stop the server you started**
rather than leaving it holding the port for the next worktree.

Friction worth knowing before it costs you a cycle:

- `bun run build` after adding any page, or the browser suite dies on a Vite manifest miss.
- Regenerate Wayfinder with `php artisan wayfinder:generate --with-form` (or just
  `bun run build`); without the flag the `.form()` helpers are missing and typecheck fails.
- Boost's tools answer about the checkout this session launched in — check with
  `get-absolute-url` once. In a worktree session it returns the `t<N>.` site.

## 4 · Any user-facing surface: run `impeccable` before showing it

**A wireframe rendered in code is not a design.** Reimplement one faithfully and you
reproduce its layout *and* its placeholder decisions, which then ship looking finished.
Measured on a descendant: a dialog carried over from a demo arrived with three identical
bordered cards stacked inside it (a card grid, and nested), a decorative ring that read as
something else entirely, two visual vocabularies for one job, and a heading repeating the
link just clicked. The human found every one by looking, across four rounds. Every one is
something `impeccable` names.

So **call the Skill tool with `impeccable` against the running Herd site as part of building
the surface** — not after the gate, not after the tests. It loads the project's own design
context where one exists. Fix what it finds, then show the human.

## 5 · Walk it in a browser

**A green suite is evidence about the tests, not about the app.** Open the thing and use
it. On the descendant build this loop comes from, one ticket shipped three defects past a
green suite, two reviewers and two rounds of verification — and every one fell out the
moment somebody clicked through: a recovery link that rotated a password when a mail scanner
opened it, a suspended user dropped at the login box with no message, a logo link that wiped
the only copy of a one-time password.

Drive the ticket's site with a browser automation skill (`playwriter` where installed — read
its own skill in full first). Do not skip this because the browser suite is green — those
assertions are text presence, and they pass on a broken layout, an unrendered prop or an
empty state nobody can reach.

Walk **every state the ticket touched**, not just the happy path:

- The success path end to end, as a user would: type, submit, land, use what you were given.
- Each rejection and each empty state. Reach the awkward ones for real — mint the token,
  suspend the account mid-session, use the account with no email.
- The states nobody navigates to on purpose: a spent link, a reloaded confirmation, the back
  button after a one-time reveal.
- **A keyboard-only pass on every form.** Tab from the top: every control reachable, in
  visual order, and focus lands somewhere useful after a failed submit. Nothing else in the
  loop looks at this.

After every action print the page URL, a snapshot, and the latest console logs. A console
error here is a bug the suite cannot see.

**Verify side effects out of band.** If a screen claims something changed — or claims
nothing did — check the database (Boost's `database-query`, or
`php artisan tinker --execute`), not the screen's own copy. The screen is the thing under
test.

Screenshot anything a person will read under pressure (a credential, an error, a dead end)
and *look* at it. Fix what you find, then carry on — the suite and the gate come later.

### …then ask what neither the suite nor the browser can see

Both run in *a* configuration. Production runs in another, and each hides a different class
of defect. Ask once: **what does the deployed configuration do that neither of these did?**
The three that have bitten:

- **`route:cache`** — a deploy runs it, and it serialises a different structure than live
  matching reads. A route taken back from a package without matching the method sets
  one-for-one passes every test and 404s in production. If the ticket touches `routes/`:
  `php artisan route:cache`, check `route:list`, then `route:clear`.
- **The proxy** — behind a load balancer every request carries the balancer's IP, so per-IP
  rate limiters collapse into a single bucket without trusted proxies, and generated URLs
  come out `http://`. If the ticket adds a limiter or mails a link, check it.
- **The scheme** — the browser suite runs on `127.0.0.1`, which is a secure context; a Herd
  `.test` domain on `http` is not. Anything gated on `window.isSecureContext` (crypto,
  `Inertia::encryptHistory`) passes the suite and throws in a real browser.

## 6 · Gate tickets: the human reviews and accepts, before anything is pinned

**A `🛑 GATE` ticket stops here, not at the PR.** The gate exists so a round's patterns are
settled before they replicate; settling them is the human's call, and everything downstream
of this point costs a full cycle to redo. Measured on a descendant: one block went through
three shapes in one sitting once the human could see it, each round one screenshot and one
sentence. The same three rounds *after* the suite and the gate would have been three full
re-runs plus the tests rewritten each time.

So on a gate ticket:

1. Steps 3–5 are done: the surface works on the Herd site, the design pass has run and you
   have walked every state. Do not hand the human a wireframe to critique.
2. **Hand it over and stop.** Name what to click, on which account, and what you are unsure
   about. Screenshots help; the running site helps more.
3. Iterate on what they say until they sign off. Findings here get one commit each, like any
   other review round.
4. **Only then** go to step 7's code review, step 8's verifier, and the tests at step 10.

A non-gate ticket skips this step: the agent-side reviews are the whole review.

## 7 · Adversarial code review — on the branch, before the tests

Call the Skill tool with `code-review` against **the branch** — it reviews changes since a
fixed point, so the merge-base with the branch's base is the point and no PR is needed yet.
Standards + Spec axes. The implementer fixes confirmed findings; re-review. Max 3 rounds;
unresolved PLAUSIBLE findings are carried into the landing note at step 12 for the human's
judgment.

**Before the tests, deliberately.** A review that lands after them makes every confirmed
finding a code change *and* a test rewrite, and the second half is pure waste on a finding the
reviewer was right about. Reviewing untested code is the trade: it is a review of the code,
not of its coverage, and step 10 is where coverage arrives. Say so in the invocation, or the
reviewer spends a round reporting the absence of tests as its top finding.

## 8 · Spec-conformance verification (fresh context)

Spawn a **subagent that has not seen the implementation reasoning**. Its instructions: read
the ticket, the parent spec and every spec chapter and wireframe it names — then attack the
built result (the branch's diff against its base, and the running site) for divergence:
missing fields, wrong states, copy that isn't the spec's copy, behaviour that contradicts a
stated rule. It reports findings only; the implementer fixes; re-verify. Max 3 rounds — and
use them. On a descendant, round 2 caught two of round 1's four fixes being themselves
defective, one of them live in the deployed configuration only. **A fix gets the same
scrutiny as the original code**: a finding tells you what is wrong, not what is right.

**Every deferral must name a ticket, and the verifier must open it.** A ticket that stores
data without a screen, or adds a column nothing reads, is normal — the build is sliced that
way on purpose. What is not normal is "#NN owns that" going unchecked. For each thing this
ticket deliberately leaves unbuilt — the list is already written, in step 1's brief — the
verifier confirms the named issue **exists, is open, and carries an acceptance criterion
covering it**, quoting the criterion. Anything deferred to a ticket that does not say so is
nobody's job, and is a finding. So the verifier's instructions must name those downstream
tickets, not just the parent spec.

## 9 · Impeccable second look (UI tickets only)

**The design pass already ran, at step 4.** This is the second look, over what changed since:
the code review's fixes and the verifier's fixes land under time pressure, and that is
exactly where a card grid or a second button vocabulary creeps back in. Call the Skill tool
with `impeccable` on the diff since step 4, fix findings, record the verdict — it goes in the
landing note.

If nothing user-facing changed since step 4, say so and carry that verdict forward rather
than re-running the whole pass.

## 10 · Now write the tests

**Everything above settled the shape. This is where it gets pinned.**

**Call the Skill tool with `test-quality` and with `testing-best-practices` before writing the
first test.** The always-on "What a Good Test Is" guideline is the short form; those two are
the checklists step 10b grades against, so write to them rather than discover them there.

Everything the project's test rules ask for applies in full; it applies here rather than at
the start:

- Feature is the default suite, Unit for pure logic, **permutations down the stack** (one
  feature test per wiring path; case matrices as datasets at the cheapest level that can
  falsify the logic).
- `composer test:*` wrappers only; single-test debugging via `--filter`. A `PreToolUse` guard
  blocks bare `pest` / `phpunit` / `php artisan test`.
- **Every ticket with a user-facing surface owes at least one browser spec** in
  `tests/Browser`, and it has to earn its place — name what in it only a browser can
  falsify. Step 12's landing note states that claim.
- **Assert what the page receives, not what the session holds.** `assertSessionHasErrors(...)`
  passes whether or not any page reads the bag.
- An assertion that compares a value with itself proves nothing.

## 10b · Tear the tests apart (fresh context)

The implementer grades its own tests generously: they pass, coverage rises, and nothing asks
what they would catch. So spawn a **subagent that did not write them**. Its instructions:
call the Skill tool with `test-quality` first, then review **only the tests this branch adds
or changes** (`git diff <base>...HEAD -- tests resources/js/**/*.test.*`) against the code
they exercise — for each test, name the wrong implementation it catches, then check every
item of the checklist. It reports findings in the skill's format and edits nothing.

The implementer fixes confirmed findings; re-review. Max 3 rounds. Unresolved PLAUSIBLE
findings go into the landing note at step 12 for the human's judgment.

**After the code review, deliberately.** The shape is settled by now, so a finding here costs
a test rewrite and nothing else — the cheapest point in the loop to make the tests honest.

## 11 · The green gate — `composer preflight`

**This step blocks. Nothing downstream starts until it passes.**

```
composer preflight
```

Four gates, run in parallel: **Pest coverage** (type coverage + `--exactly=100.0`),
**frontend coverage**, **lint**, **types**. `composer test:ci` runs the identical four
serially and is what CI uses — locally always prefer `preflight`, which parallelises them and
remembers failures (`php artisan toolkit:preflight --retry` re-runs only the gates that
failed).

- **Red means not done.** A failing gate is implementation work, not a formality to waive.
  New code without tests fails the coverage gate by design. Never lower a threshold, exclude
  a file from coverage, or add a PHPStan baseline entry to get past it without saying so out
  loud to the human first.
- **Keep the summary table.** It goes verbatim into the landing note (step 12) and into
  whatever you report back. "Preflight passes" without the table is not evidence.
- If a gate fails for a reason genuinely outside the ticket (a pre-existing break on the
  base branch), say so explicitly, fix it inside this ticket if it is small, and note it —
  do not silently step around it. A gate that fails once under parallel load and passes on
  `--retry` is load, not a defect; say which it was.

## 12 · Land

Gate tickets: the human's session already happened at **step 6**, before anything was
pinned. If the ticket changed shape since, show them the diff before landing — but do not
hold a second full review here.

**The landing note** is the same in both modes: it opens with **what now exists** (step 13's
account, in plain language), then the acceptance criteria as a checked list, **step 11's
preflight summary table**, the verifier's verdict, the impeccable verdict, any unresolved
review findings, and **the browser spec claim** — one line naming the spec in
`tests/Browser` and what in it *only a browser* can falsify (rendered visibility, a state
transition across an Inertia visit, a console error). If a feature test could falsify the
same assertion, say that instead of hiding it.

**PR mode** — open the PR with the `finish-feature-branch` skill (or `gh pr create`): title
`t<N>: <ticket title>`. Call the Skill tool with `pr` for the body's shape, and make the
landing note its content, with `Closes #<N>`. A PR without a green preflight table is not
ready to open.

**Integration mode** — merge the ticket branch into the integration branch and push it
(never `main`), before teardown: from a worktree, do it from a clean checkout of the
integration branch (a throwaway `git worktree add` of it works); in place, the commits are
already there. Teardown publishes the ticket's TIA baseline only once its commits are on the
integration branch, then deletes the cache, so a merge left for later costs the next ticket a
full run. Post the landing note
as a comment on the ticket, tick its acceptance criteria, and close it — closing is what
moves the next tickets onto the frontier. No PR per ticket: the integration branch ships as
one PR when the spec is done.

## 13 · Stop — report what was built — then hand back to main

**Report in two registers, results first.** Gates and verdicts are evidence; they are not an
answer to "what did you build". On the descendant this loop comes from, the human had to ask
*"so, what has been built?"* with the PR already open and reviewed — the loop had reported
four green gates, three verification rounds and two review verdicts, and had never once said
what the software does now.

Write it against step 1's brief, in the same plain language, so the two can be read side by
side:

- **What a person can now do**, screen by screen, with the URLs to try it on.
- **What changed underneath**: tables, columns, routes, packages, anything deleted.
- **What this ticket did not build**, and the ticket that owns each piece.
- **What changed since the brief, and why** — every divergence, including the ones the
  verifier and the reviewers forced. This diff is the cheapest scope-drift detector in the
  loop; if it is long, say so rather than smoothing it.

Then the evidence: PR URL (or the integration branch and the closed ticket), the preflight
table, verdicts, anything unresolved. In PR mode, **wait** — the human merges. Merges are
**merge commits, never squash**: a ticket lands as several commits on purpose, and squashing
throws that trail away.

### After the merge (or, in integration mode, after closing the ticket)

**In a worktree**, two commands. This session does what only it can do, then hands the rest
to main and dies — it cannot delete the tree it is standing in.

```bash
scripts/worktree-teardown.sh      # publishes the TIA baseline; removes site, databases, TIA cache
scripts/handoff-to-main.sh <N>    # opens /finish-ticket in a main-checkout session
```

Use the scripts. **Do not hand-roll the `supacode` calls**: their `--repo` and `--worktree`
default to `$SUPACODE_REPO_ID` / `$SUPACODE_WORKTREE_ID`, and those variables go stale
mid-session — one measured drift pointed at a completely unrelated project.
`scripts/supacode-ids.sh` derives both from `git`. Without Supacode, `handoff-to-main.sh`
prints the command to run in main instead; relay it.

Then say that the handoff happened, and stop. The new session deletes this worktree — **this
session dies mid-sentence when it does**, which is fine and expected. Nothing you have not
already written to GitHub survives, which is why the account lives in the landing note: that
is where `/finish-ticket` reads it.

**In place**, there is nothing to tear down: stop the dev server if you started one, publish the
ticket's TIA baseline for the next ticket on its base (`php artisan toolkit:tia publish --base=<base>`,
still on the ticket's branch), switch back to the base branch, and run `scripts/refresh-main.sh`.

### If the ticket stalls instead

Three failed rounds, a blocker, or the human calling it off. Release the lock
(`gh issue edit <N> --remove-label in-progress`), say plainly what stopped it, then — in a
worktree — **ask whether to keep the worktree or tear it down**, one question, two options:

- **Keep** — the site stays up so the failure can be looked at. Print the delete command for
  later.
- **Tear down** — `scripts/worktree-teardown.sh`, then hand off to `/finish-ticket` exactly
  as above. It checks for unmerged commits before deleting.

Never guess between them. A stalled ticket is precisely when the evidence is worth keeping,
and precisely when leftover trees accumulate unnoticed.
