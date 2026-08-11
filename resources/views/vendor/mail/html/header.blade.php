@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
{{-- Raster logo: most mail clients don't render SVG. Regenerate public/email-logo.png
     from public/logo.svg when rebranding (400x100, white background, 2x for retina). --}}
<img src="{{ asset('email-logo.png') }}" alt="{{ config('app.name') }}" style="height: 50px; width: auto; display: block; margin: 0 auto;">
</a>
</td>
</tr>
