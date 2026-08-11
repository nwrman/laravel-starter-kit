import { act, render, screen } from '@testing-library/react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { setPageUrl } from '@/testing/helpers';
import { useCloseMobileSidebarOnNavigate } from './use-close-mobile-sidebar-on-navigate';

/** Drives the hook and exposes the sheet state the way the sidebar consumes it. */
function Probe() {
  const { openMobile, setOpenMobile } = useSidebar();

  useCloseMobileSidebarOnNavigate();

  return (
    <>
      <span>{openMobile ? 'sheet-open' : 'sheet-closed'}</span>
      <button type="button" onClick={() => setOpenMobile(true)}>
        open sheet
      </button>
    </>
  );
}

const sheetState = () => (screen.queryByText('sheet-open') ? 'open' : 'closed');

describe('useCloseMobileSidebarOnNavigate', () => {
  it('closes the mobile sheet when the url changes', async () => {
    setPageUrl('/dashboard');

    const { rerender } = render(
      <SidebarProvider>
        <Probe />
      </SidebarProvider>,
    );

    await act(async () => {
      screen.getByText('open sheet').click();
    });

    expect(sheetState()).toBe('open');

    setPageUrl('/projects');

    await act(async () => {
      rerender(
        <SidebarProvider>
          <Probe />
        </SidebarProvider>,
      );
    });

    expect(sheetState()).toBe('closed');
  });

  it('leaves the sheet open while the url is unchanged', async () => {
    setPageUrl('/dashboard');

    const { rerender } = render(
      <SidebarProvider>
        <Probe />
      </SidebarProvider>,
    );

    await act(async () => {
      screen.getByText('open sheet').click();
    });

    await act(async () => {
      rerender(
        <SidebarProvider>
          <Probe />
        </SidebarProvider>,
      );
    });

    expect(sheetState()).toBe('open');
  });
});
