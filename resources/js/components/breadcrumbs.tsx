import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

/**
 * The full trail. `flex-nowrap` is load-bearing: BreadcrumbList wraps by default, and a
 * wrapped trail overflows the header's fixed height instead of truncating.
 */
function FullTrail({ breadcrumbs }: { breadcrumbs: BreadcrumbItemType[] }) {
  return (
    <BreadcrumbList className="flex-nowrap">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <Fragment key={item.title}>
            <BreadcrumbItem className={isLast ? 'min-w-0' : 'shrink-0'}>
              {isLast ? (
                <BreadcrumbPage className="truncate">{item.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={item.href} />}>{item.title}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator className="shrink-0" />}
          </Fragment>
        );
      })}
    </BreadcrumbList>
  );
}

/**
 * Narrow screens can't fit a deep trail — it used to wrap onto several lines and spill
 * out of the header. Below `md` the middle of the trail collapses into a menu, keeping
 * every level reachable on one line: `Inicio > … > Crear Proyecto`.
 */
function CollapsedTrail({ breadcrumbs }: { breadcrumbs: BreadcrumbItemType[] }) {
  const current = breadcrumbs[breadcrumbs.length - 1];
  const [first, ...rest] = breadcrumbs;
  const middle = rest.slice(0, -1);

  return (
    <BreadcrumbList className="flex-nowrap">
      {breadcrumbs.length > 1 ? (
        <>
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink render={<Link href={first.href} />}>{first.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="shrink-0" />
          {middle.length > 0 ? (
            <>
              <BreadcrumbItem className="shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<button type="button" aria-label="Ver ruta completa" />}
                  >
                    <BreadcrumbEllipsis />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuGroup>
                      {middle.map((item) => (
                        <DropdownMenuItem key={item.title} render={<Link href={item.href} />}>
                          {item.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="shrink-0" />
            </>
          ) : null}
        </>
      ) : null}
      <BreadcrumbItem className="min-w-0">
        <BreadcrumbPage className="truncate">{current.title}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
}

export function Breadcrumbs({ breadcrumbs }: { breadcrumbs: BreadcrumbItemType[] }) {
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <>
      <Breadcrumb className="md:hidden">
        <CollapsedTrail breadcrumbs={breadcrumbs} />
      </Breadcrumb>
      <Breadcrumb className="hidden md:block">
        <FullTrail breadcrumbs={breadcrumbs} />
      </Breadcrumb>
    </>
  );
}
