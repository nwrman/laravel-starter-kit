<?php

declare(strict_types=1);

use App\Models\User;

it('sorts a column both ways and pages through the shared data table', function (): void {
    $this->actingAs(User::factory()->create());

    // The second click is the load-bearing one: under the React Compiler the header
    // memoized on its column object, kept reading "unsorted" and sorted ascending again.
    // The Vitest suite runs without the compiler and passed with that bug in place.
    visit('/projects')
        ->click('thead button:has-text("Presupuesto")')
        ->assertSeeIn('tbody tr:first-child', 'Rediseño de Landing Page')
        ->click('thead button:has-text("Presupuesto")')
        ->assertSeeIn('tbody tr:first-child', 'Refactor del Monolito')
        ->click('[aria-label="Página siguiente"]')
        ->assertSee('Página 2 de 2')
        // Descending by budget, page 2 opens on the 11th: Chatbot con IA at $110K.
        ->assertSeeIn('tbody tr:first-child', 'Chatbot con IA')
        ->assertNoJavaScriptErrors();
});

it('sorts the team table both ways', function (): void {
    $this->actingAs(User::factory()->create());

    visit('/team')
        ->click('thead button:has-text("Utilización")')
        ->assertSeeIn('tbody tr:first-child', 'Valentina Cruz')
        ->click('thead button:has-text("Utilización")')
        ->assertSeeIn('tbody tr:first-child', 'Ana López')
        ->assertNoJavaScriptErrors();
});
