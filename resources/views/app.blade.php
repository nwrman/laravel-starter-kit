<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }
        </style>

        <script>
            if (navigator.platform.toUpperCase().includes('MAC')) {
                document.documentElement.classList.add('macos');
            }
        </script>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <meta name="description" content="{{ config('app.description') }}" />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="{{ config('app.name', 'Laravel') }}" />
        <link rel="manifest" href="/site.webmanifest" />

        {{-- Open Graph / Twitter. Crawlers don't reliably resolve relative paths, so
             image and url must be absolute — asset() and url()->current() handle that.
             Replace public/og-image.png (1200x630) with your own brand card. --}}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="{{ config('app.name', 'Laravel') }}" />
        <meta property="og:title" content="{{ config('app.name', 'Laravel') }}" />
        <meta property="og:description" content="{{ config('app.description') }}" />
        <meta property="og:url" content="{{ url()->current() }}" />
        <meta property="og:image" content="{{ asset('og-image.png') }}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="{{ str_replace('-', '_', app()->getLocale()) }}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="{{ config('app.name', 'Laravel') }}" />
        <meta name="twitter:description" content="{{ config('app.description') }}" />
        <meta name="twitter:image" content="{{ asset('og-image.png') }}" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
