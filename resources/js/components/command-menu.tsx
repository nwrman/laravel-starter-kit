import { router } from '@inertiajs/react';
import { FolderOpen, Users } from 'lucide-react';
import { Fragment } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

type MockRecord = {
  label: string;
  subtitle: string;
  href: string;
};

type ModelGroup = {
  heading: string;
  icon: typeof FolderOpen;
  records: MockRecord[];
};

const mockData: ModelGroup[] = [
  {
    heading: 'Proyectos',
    icon: FolderOpen,
    records: [
      { label: 'Rediseño Web Corporativo', subtitle: 'Activo · Jane Smith', href: '/projects/1' },
      { label: 'App Móvil v2', subtitle: 'Activo · Carlos Rivera', href: '/projects/2' },
      { label: 'Migración a Cloud', subtitle: 'Activo · Ana López', href: '/projects/3' },
      { label: 'API Gateway', subtitle: 'Activo · Miguel Torres', href: '/projects/4' },
      { label: 'Dashboard de Analytics', subtitle: 'Activo · Laura Martínez', href: '/projects/5' },
      { label: 'Portal de Clientes', subtitle: 'Completado · Jane Smith', href: '/projects/7' },
    ],
  },
  {
    heading: 'Equipo',
    icon: Users,
    records: [
      { label: 'Jane Smith', subtitle: 'Directora de Ingeniería', href: '/team' },
      { label: 'Carlos Rivera', subtitle: 'Desarrollador Senior', href: '/team' },
      { label: 'Ana López', subtitle: 'Gerente de Proyectos', href: '/team' },
      { label: 'Miguel Torres', subtitle: 'Arquitecto de Software', href: '/team' },
    ],
  },
];

type CommandMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const navigate = (href: string) => {
    onOpenChange(false);
    router.visit(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Buscar"
      description="Buscar proyectos, equipo y recursos"
    >
      <Command>
        <CommandInput placeholder="Buscar proyectos, equipo..." />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>

          {mockData.map((group, idx) => (
            <Fragment key={group.heading}>
              {idx > 0 && <hr />}
              <CommandGroup heading={group.heading}>
                {group.records.map((record) => (
                  <CommandItem
                    key={record.href}
                    value={`${record.label} ${record.subtitle}`}
                    onSelect={() => navigate(record.href)}
                  >
                    <group.icon />
                    <div className="flex flex-col">
                      <span>{record.label}</span>
                      <span className="text-xs text-muted-foreground">{record.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Fragment>
          ))}
        </CommandList>

        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Esc</kbd>
          <span className="ml-1.5">para cerrar</span>
        </div>
      </Command>
    </CommandDialog>
  );
}
