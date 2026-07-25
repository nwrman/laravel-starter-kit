# 7. Typed props pipeline: laravel-data + typescript-transformer

Date: 2026-07-24

## Status

Accepted

## Context

Wayfinder already gives the frontend typed, generated route functions — but page
*props* remain hand-written TypeScript interfaces that drift silently from what
controllers actually pass. minuta proved the fix on this exact stack
(Inertia + React): spatie/laravel-data DTOs with
spatie/laravel-typescript-transformer generating the TS types pages consume.

This is core-shaping: retrofitting later means touching every page, so the
decision had to be made before the Phase-1 features (data-table endpoints, user
management) define their payloads.

## Decision

Adopt **spatie/laravel-data + spatie/laravel-typescript-transformer** in the
starter core. Controllers pass Data objects; the transformer generates the
TypeScript types; pages import generated types instead of hand-written
interfaces. Backend data shapes get the same end-to-end guarantee Wayfinder
gives routes.

## Consequences

- One more generation step in the build, mirroring `wayfinder:generate`.
- Every Phase-1+ feature defines its payloads as Data classes from day one;
  existing pages migrate opportunistically, not big-bang.
- Hand-written prop interfaces in new code are a review smell.
