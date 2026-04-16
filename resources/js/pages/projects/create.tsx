import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/button';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inicio', href: '/dashboard' },
  { title: 'Proyectos', href: '/projects' },
  { title: 'Crear Proyecto', href: '/projects/create' },
];

export default function ProjectCreate() {
  return (
    <>
      <Head title="Crear Proyecto" />
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Crear Proyecto</h1>
            <p className="text-muted-foreground">
              Completa los datos para crear un nuevo proyecto.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <Form action="/projects" method="post">
            {({ processing, errors }) => (
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre del Proyecto</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    autoFocus
                    placeholder="Ej: Rediseño Web Corporativo"
                  />
                  <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Descripción breve del proyecto..."
                  />
                  <InputError message={errors.description} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select name="status" defaultValue="Planificación">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planificación">Planificación</SelectItem>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="En Espera">En Espera</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={errors.status} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="budget">Presupuesto (MXN)</Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="150000"
                    />
                    <InputError message={errors.budget} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="deadline">Fecha Límite</Label>
                    <Input id="deadline" name="deadline" type="date" />
                    <InputError message={errors.deadline} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="team_lead">Líder del Proyecto</Label>
                    <Select name="team_lead">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar líder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                        <SelectItem value="Carlos Rivera">Carlos Rivera</SelectItem>
                        <SelectItem value="Ana López">Ana López</SelectItem>
                        <SelectItem value="Miguel Torres">Miguel Torres</SelectItem>
                        <SelectItem value="Laura Martínez">Laura Martínez</SelectItem>
                        <SelectItem value="Roberto Sánchez">Roberto Sánchez</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={errors.team_lead} />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Link href="/projects">
                    <Button variant="outline" type="button">
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" processing={processing}>
                    Crear Proyecto
                  </Button>
                </div>
              </div>
            )}
          </Form>
        </div>
      </div>
    </>
  );
}

ProjectCreate.layout = () => ({ breadcrumbs });
