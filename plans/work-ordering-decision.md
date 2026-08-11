# Deciding the build order — read, pick, then specs get written

This file explains the pending work and the ordering choices **you** need to make.
Nothing here is decided except what the ADRs already fixed. When you've picked,
the specs get written in that exact order (one spec = one future work session).

## The work, in plain words

**The big chain (order forced, explained below):**

| Piece | What it is |
|---|---|
| **Typed props** | Install the system where backend data shapes auto-generate the TypeScript types pages use. Invisible plumbing; prevents silent type drift. |
| **Server data-table** | Today the table loads ALL rows and paginates in the browser — fine for 50 rows, dead at 5,000. Make the database do sort/filter/page/search. |
| **Teams** | The `teams` table, "team = the company account", every scoped row gets `team_id`, team switcher in the sidebar. Harvested from minuta. |
| **Strip command** | The toolkit command that deletes teams from a fresh clone for simple apps, plus CI proving both shapes (with/without) stay green. |
| **Permissions + audit** | Roles per team (admin of company A, viewer in B), one global super-admin for Filament, and the who-did-what activity log. |
| **User management screens** | The payoff screen: members list, invite by email, deactivate, assign roles, team settings — plus branded emails (minuta's templates) so the invite mail looks like your app, not stock Laravel. |

**Why that chain is forced:** typed props must exist before the others so their
data shapes are born typed (retrofitting = redoing). The members list *is* a
data-table, so the table comes before it. Roles must exist before an "assign
role" dropdown can. Teams must exist before anything that hangs off teams.

**The independent pieces (slot anywhere):**

| Piece | What it is | Size |
|---|---|---|
| **Warm-up backports** | The table-reset bugfix trapped in campaign-messenger + 3 test files from my-life-hub. | small |
| **i18n** | Move every hardcoded Spanish string ("Iniciar sesión") into language files. English becomes the source, Spanish ships as translation. Touches every page once. | medium |
| **Component backports** | minuta's comboboxes, date pickers, page-header, settings-section, status badge → starter component library. | small-medium |
| **Global search (⌘K)** | The command menu today is static links. Add real search: type a name, find the member/project. Needs teams (results must respect team boundaries). | medium |
| **Notifications** | Bell icon, unread badge, notification center. No app of yours has this yet. Needs teams. | medium |
| **Audit viewer** | The screen showing the activity log ("María changed X"). Needs permissions+audit and the table. | small-medium |
| **Import/export** | minuta's 4-step import wizard (Upload→Map→Preview→Result) generalized, + export-to-Excel from any table. Needs the table. | medium |
| **Toolkit: glue** | Move to the toolkit package: passkey security glue, session-expired detection, RecordLastLogin, Telegram channel. Separate repo; fixes then reach all apps via `composer update`. | medium |
| **Toolkit: WhatsApp** | campaign-messenger's WhatsApp plumbing → dormant toolkit module (built twice already; raudal will need it a third time). | medium |

---

## Choice 1 — Where does i18n go?

**Option A — Early (before the user-management screens).**
The string migration happens while the app is still small. Every screen built
afterwards (members, invites, notifications…) is written with translation keys
from day one — those screens never need a second pass.
*Cost:* delays the visible features by roughly one session.

**Option B — Late (after everything is built).**
Visible features arrive sooner. But every screen built in between is born with
hardcoded strings, and the eventual migration pass is bigger and touches code
that was "finished".
*Cost:* the user-mgmt, search, and notifications screens all get reopened later.

**Recommendation: A.** The whole reason i18n made the roadmap is that talok had
to unpick hardcoded strings after the fact — Option B recreates that exact story
inside the starter.

## Choice 2 — Where does the small stuff go?

The warm-up backports and component backports are small, independent, low-risk.

**Option A — Both first.** Two quick wins; descendants' fixes come home
immediately; the component library is richer before the big screens are built
(user mgmt can use the backported date pickers/comboboxes).

**Option B — Warm-ups first, components later.** Start with the tiny bugfix
session, leave comboboxes/date-pickers until a screen actually needs one.

**Recommendation: A** — the components are proven code sitting in minuta; having
them on the shelf before building screens avoids "build it mid-session" detours.

## Choice 3 — Toolkit work: interleaved or parked?

**Option A — Parked until the starter chain is done.** One repo, one focus; the
toolkit items (passkey glue, WhatsApp…) aren't blocking anything in the chain.
*Risk accepted:* until extraction, a passkey security fix still travels by hand.

**Option B — Interleaved (e.g., one toolkit session after teams land).** Spreads
the context-switching but gets glue fixes flowing to descendants sooner.

**Note:** the **strip command** lives in the toolkit repo either way — it's part
of the forced chain, not this choice.

**Recommendation: A.** Focus beats early extraction; nothing has actually broken
from the glue living in the starter for a few more weeks.

## Choice 4 — After user management: keep building or pause and use it?

**Option A — Pause and dogfood.** Once the chain lands (teams, roles, members,
invites), start a real app on the starter — caudal's seed, or the next idea —
and let real usage tell you whether search/notifications/audit-viewer are what
Phase 2 should actually be.
*Cost:* Phase 2 waits.

**Option B — Keep building Phase 2 immediately.** Search, notifications, audit
viewer while context is hot.
*Cost:* three more sessions of speculative building with zero real users of the
new features.

**Recommendation: A.** Every feature in the roadmap earned its place by being
proven in a real app first — that's your own pattern. Phase 2 should earn it the
same way.

---

## Answer sheet

Reply with your four picks (e.g. "1A 2A 3A 4A", or corrections in any form),
plus any reordering of the forced chain you disagree with. Then the specs get
written in that exact order.
