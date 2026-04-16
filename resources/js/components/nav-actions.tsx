import { Link } from '@inertiajs/react';
import { Bell, FolderOpen, Plus, Users } from 'lucide-react';
import { Button } from '@/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const quickCreateItems = [
  { label: 'Nuevo Proyecto', href: '/projects/create', icon: FolderOpen },
  { label: 'Nuevo Miembro', href: '/team', icon: Users },
];

export function NavActions() {
  return (
    <div className="flex items-center gap-1 md:gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
          <Bell className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Sin notificaciones
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button />}>
          <Plus className="size-4" data-icon="inline-start" />
          Crear
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {quickCreateItems.map((item) => (
            <DropdownMenuItem key={item.label} render={<Link href={item.href} />}>
              <item.icon className="size-4" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
