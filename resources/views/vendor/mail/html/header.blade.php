@props(['url'])
<tr>
<td class="header">
{{-- Same lockup as the app sidebar: the brand mark on the primary tile, then the app
     name. The image is public/email-logo.png, generated from public/logo.svg by
     `bun run brand` (raster, not SVG — most mail clients won't render SVG). The name
     stays dynamic, so renaming the app needs no new asset. See docs/branding.md. --}}
<a href="{{ $url }}" style="display: inline-block; text-decoration: none;">
<img src="{{ asset('email-logo.png') }}" alt="" width="48" height="48" style="height: 48px; width: 48px; border-radius: 11px; vertical-align: middle; border: none;">
<span style="vertical-align: middle; margin-left: 10px;">{{ config('app.name') }}</span>
</a>
</td>
</tr>
