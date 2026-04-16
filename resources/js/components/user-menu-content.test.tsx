import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/* eslint-disable @typescript-eslint/unbound-method */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createUser } from '@/testing/helpers';
import { UserMenuContent } from './user-menu-content';

function renderInMenu(user = createUser()) {
  return render(
    <DropdownMenu open>
      <DropdownMenuTrigger>
        <div>Open</div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <UserMenuContent user={user} />
      </DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe('UserMenuContent', () => {
  it('renders user info with email', () => {
    renderInMenu(createUser({ name: 'Admin', email: 'admin@example.com' }));

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('renders settings text', () => {
    renderInMenu();

    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('renders logout text', () => {
    renderInMenu();

    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('handleLogout calls router.flushAll when logout button is clicked', async () => {
    const { router } = await import('@inertiajs/react');
    const user = userEvent.setup();
    renderInMenu();

    const logoutButton = document.querySelector('[data-test="logout-button"]');
    expect(logoutButton).toBeInTheDocument();
    if (logoutButton) {
      await user.click(logoutButton);
      expect(router.flushAll).toHaveBeenCalled();
    }
  });
});
