# 2. Tiered form convention

Date: 2026-07-24

## Status

Accepted

## Context

The app has two kinds of forms with different needs. Settings and update forms
(profile edit, password change, account deletion) are field-rich, benefit from
client-side validation, and need server errors mapped cleanly back onto
individual fields. Guest auth forms (login, registration) are short, submitted
once, and already work well with Inertia's built-in form handling.

Using one approach everywhere would either over-engineer the simple guest pages
or under-serve the settings pages. The official starter kit uses plain Inertia
`<Form>` even for the settings password form; we diverge deliberately.

## Decision

Two tiers, chosen by form type:

- **Settings / update forms** use **TanStack Form + Zod**. They use the local
  field components — `TextField`, `PasswordField`, `SelectField`, `CheckboxField`
  from `resources/js/components/form-fields.tsx` — and the
  `useInertiaForm` hook from `resources/js/hooks/use-inertia-form.ts`, which
  bridges TanStack validation with Inertia submissions and maps Inertia server
  errors onto TanStack's `errorMap.onServer`.
- **Guest auth pages** use the plain Inertia `<Form>` + `InputError` pattern with
  uncontrolled inputs — no TanStack, no Zod.

The seam is the form's role, not its route group: `settings/security.tsx`'s
password-change form is a settings update form and uses TanStack + Zod, even
though upstream's equivalent uses plain Inertia `<Form>`.

## Consequences

- A reader seeing two form styles in the codebase should not read it as
  inconsistency — it is this convention. New forms pick their tier by role.
- Settings forms must keep using the shared field components and `useInertiaForm`
  rather than rolling their own validation wiring, so server-error mapping stays
  uniform.
- Reversing (collapsing to one tier) touches every form, so the convention is
  moderately sticky.
