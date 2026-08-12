# 11. Laravel Cloud provisioning: toolkit stub plus a wizard skill

Date: 2026-08-12

## Status

Accepted

## Context

Laravel Cloud is the lineage's deploy target. Four descendants carry
`scripts/cloud-build.sh`; talok-app and campaign-messenger are live on Cloud
under two different organizations. Only talok-app had a *provisioner* — the
script that creates the application, environment, database, and instance in the
first place.

That script could not travel. Twelve constants were baked into its body (org,
repo, names, region, database type, instance size, domain), so reuse meant
copy-and-hand-edit. Campaign-messenger went to Cloud without it, provisioned by
hand, leaving a `.cloud/config.json` holding nothing but an org id. This is the
trapped-capability pathology [ADR 0008](0008-starter-vs-toolkit-distribution.md)
was written to stop, and anidigraf-socios — a third GitHub organization, wanting
a URL in front of customers before its domain or secrets exist — needed it next.

Three facts shaped the answer:

**Provision and Deploy are not the same act.** `cloud-build.sh` and
`cloud-deploy.sh` run on Cloud's build host, where `composer install --no-dev`
means the toolkit is absent — they *must* be app-side. `cloud-setup.sh` runs on
a developer's laptop, where the toolkit is present. Filing it beside its
siblings inherits a constraint it does not have.

**Ongoing operations are already solved, by Laravel.** `laravel/cloud-cli`
vendors a `deploying-laravel-cloud` skill covering deploy, monitor, variables,
domains, tinker, and remote commands, installed via `cloud skills:install`. It
is overwritten on update, so it must not be edited. What it lacks is only this
lineage's provisioning opinions — and it explicitly instructs agents to discover
options at runtime rather than hardcode them.

**Nothing pins the organization at create time.** No `:create` command accepts
an `--organization` flag. The CLI refuses to act when several API tokens exist
and `organization_id` is unset in `.cloud/config.json`, which prevents guessing
but not a wrong pin. Talok's script declared `ORG_ID` and never enforced it —
it wrote the intended id into `config.json` *after* creating the application,
recording an assertion it had not checked.

## Decision

Provisioning ships as **two toolkit stubs**, published into every app:

- `scripts/cloud-setup.sh` — the mutations. Create-only and re-runnable: it
  resolves-or-creates and never deploys, deletes, renames, or resizes.
- `.ai/skills/provision-laravel-cloud/` — the wizard. Gathers inputs, explains
  the trade-offs, handles the DNS and dashboard steps that cannot be scripted,
  then hands off to Laravel's vendored skill.

Inputs split across two files by ownership:

| File | Owner | Holds |
|---|---|---|
| `.cloud/config.json` | Laravel's `cloud` CLI | `organization_id`, `application_id` |
| `.cloud/provision.json` | the application | repository, names, region, sizing, optional `domain` |

The script body is therefore identical in every app; only `provision.json`
differs. `organization_id` stays in Laravel's file because that is where the CLI
reads it from — it is not ours to relocate.

Four behaviours follow from provisioning being incremental rather than a single
event at the end of a build:

- **`domain` is optional.** Omit it and the app runs on its Cloud-assigned URL.
  Add the key later and re-run to create the domain then.
- **`APP_URL` is derived, never committed.** The correct value does not exist
  until the environment does, and it changes when a domain arrives.
- **`REPLACE_IN_DASHBOARD` values are skipped, not written.** Writing a
  placeholder as a real value defeats config validation, and on a re-run would
  overwrite a secret pasted into the dashboard weeks earlier.
- **Values are discovered, not inherited.** The skill lists what Cloud offers
  today and proposes the smallest option; talok's sizes and region are one
  project's answers, not defaults.

The organization is verified twice: the skill confirms the pinned org's *name*
against the repository owner before anything is created, and the script aborts
if a created application reports a different organization than the pin.

Publishing a skill is not enough to make it usable, so `toolkit:install` now
registers every skill found in `.ai/skills` in `boost.json`. Boost's `skills`
array is what surfaces a skill in the always-loaded guidelines; without it a
skill exists on disk and no agent is ever told about it. `upstream-sync` had
been invisible this way since it was written.

## Consequences

- `cloud-setup.sh` is published rather than kept in `vendor/`, so it is present
  and versioned in the repo at provisioning time and an app may tweak it. The
  cost is N copies that can drift; the toolkit version leads and descendants
  re-publish to catch up.
- Talok-app keeps its bespoke script until it re-publishes. Per ADR 0008 the
  toolkit version leads and the descendant follows; talok's committed `APP_URL`
  and its unconditional domain step are the two things that will change.
- Scaling is deliberately out of scope. An existing instance is left untouched,
  so dashboard resizing is never silently reverted — and `provision.json`
  records what was provisioned initially, not current state.
- The skill carries reasoning rather than frozen facts. "us-east-2 because Cloud
  has no US-West" is recorded as a June 2026 worked example to verify, not a
  rule, because region availability changes.
