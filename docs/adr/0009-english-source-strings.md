# 9. i18n: English source strings, Spanish as first translation

Date: 2026-07-24

## Status

Accepted

## Context

The starter's React pages hardcode Spanish ("Iniciar sesión", "Crear cuenta").
Every app that needed a second language paid an unpicking cost: talok went
bilingual (Stripe Checkout in the page's language), raudal spans Mexico and
Costa Rica, cooperativa and admin-canacar-v2 both grew `lang/` directories.
Surprising to a future reader: the codebase *looks* Spanish-first, but the
decision is the opposite.

## Decision

Wire i18n into core once: all starter UI strings move to translation files with
**English as the source language** and **Spanish shipped as the first
translation** (`es` as the ready-made locale). Apps set their default locale in
config; new languages become an additive file, not a refactor.

## Consequences

- One-time cost: every starter page is touched during the migration.
- Hardcoded user-facing strings in new starter code are a review smell.
- talok-style string unpicking never repeats.
