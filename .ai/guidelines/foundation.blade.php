@php
/** @var \Laravel\Boost\Install\GuidelineAssist $assist */
@endphp
{{-- Overrides laravel/boost's .ai/foundation.blade.php, identical but for "Frontend Bundling": the agent owns its
     dev server, nobody else runs one. Re-sync the rest when Boost changes it. --}}
# Laravel Boost Guidelines

## Foundational Context
This application is a Laravel application running on PHP {{ PHP_MAJOR_VERSION }}.{{ PHP_MINOR_VERSION }}. Always use the APIs that match the installed major version of each package — do not assume a version.

Before relying on a package's API, confirm its installed version:
- PHP packages: run `{{ $assist->composerCommand('show --direct') }}` to list direct dependencies with versions, or `{{ $assist->composerCommand('show <vendor/package>') }}` for a single package.
- JS packages: check `package.json` for the installed versions.

@if (! empty(config('boost.purpose')))
Application purpose: {!! config('boost.purpose') !!}

@endif

@if($assist->hasSkillsEnabled())
## Skills Activation
This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.
@endif

## Conventions
- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts
- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture
- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling
- Nobody keeps a dev server running in another terminal. **Before changing the front end, make sure one serves this checkout**: `public/hot` names the Vite server the site loads from, and that URL answers. If not, start `{{ $assist->nodePackageManagerCommand('run dev') }}` in the background yourself and say so — never ask the user to — so every change reaches the site through hot reload. Stop the server you started when you are done; a server another session started is not yours to stop.
- Never `{{ $assist->nodePackageManagerCommand('run build') }}` to see a change. Build only for what reads the manifest: the browser test suite and `composer preflight`, or after an "Unable to locate file in Vite manifest" error.

## Documentation Files
- You must only create documentation files if explicitly requested by the user.
