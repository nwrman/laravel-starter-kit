import { pages, resolvePage } from './resolve-page';

describe('resolvePage', () => {
  it('finds the pages', () => {
    expect(Object.keys(pages)).toContain('../pages/error.tsx');
  });

  it('never bundles a co-located test as a page', () => {
    expect(Object.keys(pages).filter((path) => path.includes('.test.'))).toEqual([]);
  });

  it('resolves a page by its Inertia name', async () => {
    const page = await resolvePage('error');

    expect(page).toHaveProperty('default');
  });

  it('rejects a name with no page behind it', async () => {
    await expect(resolvePage('does-not-exist')).rejects.toThrow();
  });
});
