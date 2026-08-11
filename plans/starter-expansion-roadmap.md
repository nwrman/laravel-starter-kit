# Starter expansion roadmap

Outcome of the 2026-07-24 grilling session: a full census of the ecosystem and a
committed, ordered feature roadmap. Architectural decisions are ADRs
([0005](../docs/adr/0005-team-is-the-tenant.md)–[0009](../docs/adr/0009-english-source-strings.md));
this file holds the sequencing and harvest sources. When a phase ships, prune it
here.

## Ecosystem census (2026-07-24)

**Starter descendants** (clone lineage): talok-app, campaign-messenger,
cooperativa (in sync), my-life-hub, expo-scheduler, admin-canacar-v2 (stale
pre-Fortify snapshot). **Adjacent lineages:** minuta (`nwrman/mrp`, richest
harvest source), canacar/bridge (CFDI signer — domain, not starter).
**Platforms that will consume the starter but own their own tenancy layer:**
caudal, raudal (see their `docs/CONTEXT.md`).

## Phase 0 — Sync pass (pull trapped fixes home)

- [ ] `autoResetPageIndex: false` in `data-table.tsx` — campaign-messenger's fix
      for the table snapping to page 1 on poll refresh (~line 97 there)
- [ ] Backport tests from my-life-hub: `data-table-toolbar.test.tsx`,
      `data-table-column-header.test.tsx`, `command-menu.test.tsx`

## Phase 1 — Teams, roles, tables, user management

One coherent build; later items consume earlier ones.

- [ ] **Server-driven data-table**: sort/filter/paginate/search via URL params →
      Eloquent; current grid is client-side only
- [ ] **Teams** (ADR 0005): harvest minuta's `Team`, `TeamInvite`,
      `team-switcher`, `create-team-dialog`, `TeamMemberSelector`; strip command
      in toolkit; CI proves both shapes
- [ ] **Permissions + audit** (ADR 0006): spatie/permission team-scoped +
      super-admin gate; spatie/activitylog team-aware
- [ ] **User management screens** (app-facing, built on the new table): members
      list, invite by email, deactivate, assign roles
- [x] **Branded email templates** (done 2026-08-11, pulled forward for the next
      project): minuta's theme pattern applied with the starter palette —
      `vendor/mail/html/themes/default.css`, `header.blade.php` (logo via
      `asset('email-logo.png')`, alt from `config('app.name')`),
      `vendor/notifications/email.blade.php` published; `public/email-logo.png`
      rendered from `logo.svg` (regenerate when rebranding). All framework mail
      (reset, verification) now branded; covered by
      `tests/Feature/BrandedMailTest.php`. Remaining for S08: the
      `TeamInvitation` mailable ships with the invite flow. (minuta's
      `MagicLinkMail` still not adopted — see plans/backlog.md)
- [ ] **Typed props** (ADR 0007): laravel-data + typescript-transformer; new
      payloads as Data classes
- [ ] **i18n** (ADR 0009): English source strings, `es` translation shipped

## Phase 2 — Search, notifications, audit viewer

- [ ] Global search: server endpoint feeding the existing ⌘K menu (today it is
      static navigation only)
- [ ] In-app notifications: DB channel, bell, notification center, mark-read
- [ ] Audit log viewer UI over activitylog

## Phase 3 — Import/export + component backports

- [ ] Import wizard: harvest minuta's 4-step flow (Upload → Map → Preview →
      Result, `use-import-wizard`, `Services/Import`)
- [ ] Table export (CSV/Excel), generalizing minuta's `*ExportService` pattern
- [ ] Component backports from minuta: Multi/Single `ComboBox`,
      `DatePickerField`, `DateRangeFilter`, `page-header`, `settings-section`,
      `StatusBadge`

## Toolkit-bound (ADR 0008, parallel to any phase)

- [ ] Passkey security glue · session-expired detection · `RecordLastLogin`
- [ ] Telegram channel (generalize talok's)
- [ ] Teams strip/scaffold command
- [ ] WhatsApp + channel-driver machinery (campaign-messenger's
      `ChannelManager`/`ChannelDriver` + Meta suite; expo-scheduler's fake
      service for testing)

## Deliberately out (do not re-litigate without new evidence)

- **Billing** — recipe doc only: Cashier-on-Team, minuta is the reference
- **AI plumbing** — my-life-hub (laravel/ai) and campaign-messenger (LiteLLM)
  are unconverged experiments; standardize only when one wins
- **DB-per-tenant / module entitlements / Branches** — caudal & raudal's own
  layer
- **Plan limits, onboarding checklist, folio generator** — stay in minuta by
  explicit choice (2026-07-24)

## Process rule

Shared-shaped fixes land in the starter or toolkit **first**, then flow outward.
Never only in a descendant.
