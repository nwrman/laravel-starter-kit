import { FolderOpen, LayoutGrid, Users } from 'lucide-react';
import { dashboard } from '@/routes';
import { create as projectCreate, index as projectIndex } from '@/routes/projects';
import { index as teamIndex } from '@/routes/team';
import type { NavGroup, NavItem, SidebarNavEntry } from '@/types';

// Every item names the page its route renders, so <Link> swaps to it before the server
// answers (an instant visit), and keeps `prefetch`. Only a page that draws with the shared
// props alone may be named here (docs/adr/0019); navigation.test.ts renders each one so.

/** Home: the first nav item everywhere, and where the logo links. */
export const homeNav: NavItem = {
  title: 'Inicio',
  href: dashboard(),
  component: 'dashboard',
  icon: LayoutGrid,
};

export const sidebarNav: SidebarNavEntry[] = [
  homeNav,
  {
    title: 'Proyectos',
    icon: FolderOpen,
    items: [
      { title: 'Todos los Proyectos', href: projectIndex(), component: 'projects/index' },
      { title: 'Crear Proyecto', href: projectCreate(), component: 'projects/create' },
    ],
  },
  {
    title: 'Equipo',
    href: teamIndex(),
    component: 'team/index',
    icon: Users,
  },
];

export const headerNav: NavItem[] = [homeNav];

export function isNavGroup(entry: SidebarNavEntry): entry is NavGroup {
  return 'items' in entry;
}
