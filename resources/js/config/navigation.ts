import { FolderOpen, LayoutGrid, Users } from 'lucide-react';
import { dashboard } from '@/routes';
import { create as projectCreate, index as projectIndex } from '@/routes/projects';
import { index as teamIndex } from '@/routes/team';
import type { NavGroup, SidebarNavEntry } from '@/types';

export const sidebarNav: SidebarNavEntry[] = [
  {
    title: 'Inicio',
    href: dashboard(),
    icon: LayoutGrid,
  },
  {
    title: 'Proyectos',
    icon: FolderOpen,
    items: [
      { title: 'Todos los Proyectos', href: projectIndex() },
      { title: 'Crear Proyecto', href: projectCreate() },
    ],
  },
  {
    title: 'Equipo',
    href: teamIndex(),
    icon: Users,
  },
];

export function isNavGroup(entry: SidebarNavEntry): entry is NavGroup {
  return 'items' in entry;
}
