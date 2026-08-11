<?php

declare(strict_types=1);

use App\Models\User;

/**
 * Wide content (data tables) must stay inside the viewport on phones and scroll within
 * its own container.
 *
 * Grid children default to `min-width: auto`, so without `min-w-0` they refuse to
 * shrink below their content. The inner `overflow-x-auto` then never engages, and the
 * layout's `overflow-x-hidden` silently clips the table instead — leaving columns
 * unreachable with no scrollbar. Asserting on `document.scrollWidth` proves nothing
 * here: because the overflow is clipped, the page never scrolls either way.
 *
 * The tables arrive through Inertia's <Deferred>, so the probe polls for one rather
 * than measuring the first paint.
 */
it('keeps wide tables inside the viewport and scrollable on mobile', function (string $path): void {
    $this->actingAs(User::factory()->create());

    $verdict = visit($path)->on()->mobile()
        ->script(<<<'JS'
            (async () => {
                let table = null;

                for (let attempt = 0; attempt < 60 && !table; attempt++) {
                    table = document.querySelector('table');

                    if (!table) {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }
                }

                if (!table) {
                    return 'no-table-rendered';
                }

                const scroller = table.closest('.overflow-x-auto');

                if (!scroller) {
                    return 'table-has-no-scroll-container';
                }

                if (scroller.clientWidth > document.documentElement.clientWidth) {
                    return 'scroller-wider-than-viewport';
                }

                if (scroller.scrollWidth <= scroller.clientWidth) {
                    return 'table-not-scrollable';
                }

                return 'ok';
            })()
        JS);

    expect($verdict)->toBe('ok');
})->with(['/projects', '/team']);
