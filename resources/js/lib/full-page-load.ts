/**
 * Leaves the current document and loads `url` as a new one. A sign-in that answers JSON
 * navigates with this, never `router.visit()`: the signed-in session must start in its own
 * `no-store` document, not inside the guest /login one (docs/adr/0018).
 */
export function fullPageLoad(url: string): void {
  window.location.assign(url);
}
