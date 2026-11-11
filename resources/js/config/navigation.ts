import { FolderOpen, LayoutGrid, Users } from 'lucide-react';
import { dashboard } from '@/routes';
import { create as projectCreate, index as projectIndex } from '@/routes/projects';
import { index as teamIndex } from '@/routes/team';
import type { NavGroup, NavItem, SidebarNavEntry } from '@/types';

// Every item names the page its route renders, so <Link> swaps to it before the server
// answers (an instant visit). navigation.test.ts checks each name against the page list.
export const sidebarNav: SidebarNavEntry[] = [
  {
    title: 'Inicio',
    href: dashboard(),
    component: 'dashboard',
    icon: LayoutGrid,
  },
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

export const headerNav: NavItem[] = [
  {
    title: 'Inicio',
    href: dashboard(),
    component: 'dashboard',
    icon: LayoutGrid,
  },
];

export function isNavGroup(entry: SidebarNavEntry): entry is NavGroup {
  return 'items' in entry;
}
